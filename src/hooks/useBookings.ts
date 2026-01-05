import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../lib/types';
import { getTodayDate } from '../lib/billingUtils';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveBookings = () => {
    return bookings.filter(b => b.status === 'checked_in');
  };

  const getActiveBookingByRoom = (roomId: string) => {
    return bookings.find(
      b => b.room_id === roomId && b.status === 'checked_in'
    );
  };

  const createBooking = async (bookingData: {
    room_id: string;
    guest_id: string;
    check_in_date: string;
    check_out_date?: string | null;
    actual_check_in_time?: string | null;
    number_of_guests: number;
    base_amount: number;
    gst_rate: number;
    gst_amount: number;
    total_amount: number;
    amount_paid: number;
    qr_amount?: number;
    cash_amount?: number;
    payment_method?: 'cash' | 'qr' | 'mixed';
    gstin?: string | null;
    isAdvanceBooking?: boolean;
  }) => {
    try {
      // Use getTodayDate() for consistent date comparison (local time, not UTC)
      const today = getTodayDate();
      const checkInDate = bookingData.check_in_date;
      // If check-in date is today or in the past, it's a same-day check-in
      // If check-in date is in the future, it's an advance booking
      const isAdvance = bookingData.isAdvanceBooking !== undefined 
        ? bookingData.isAdvanceBooking 
        : checkInDate > today;
      
      // Determine booking status
      const status = isAdvance ? 'reserved' : 'checked_in';

      // Extract isAdvanceBooking from bookingData to avoid inserting it into database
      const { isAdvanceBooking: _, ...dbBookingData } = bookingData;

      // Determine payment method based on amounts
      const qrAmount = dbBookingData.qr_amount || 0;
      const cashAmount = dbBookingData.cash_amount || 0;
      let paymentMethod: 'cash' | 'qr' | 'mixed' = 'cash';
      if (qrAmount > 0 && cashAmount > 0) {
        paymentMethod = 'mixed';
      } else if (qrAmount > 0) {
        paymentMethod = 'qr';
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...dbBookingData,
          check_out_date: dbBookingData.check_out_date || null,
          actual_check_in_time: dbBookingData.actual_check_in_time || null,
          qr_amount: qrAmount,
          cash_amount: cashAmount,
          extended_amount: 0,
          payment_method: dbBookingData.payment_method || paymentMethod,
          status,
        }])
        .select()
        .single();

      if (error) throw error;

      // Only update room status to occupied if it's not an advance booking
      if (!isAdvance) {
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', bookingData.room_id);

        // Log room status change
        await supabase
          .from('room_status_log')
          .insert([{
            room_id: bookingData.room_id,
            booking_id: data.id,
            status: 'occupied',
          }]);
      }

      await fetchBookings();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const checkOut = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const now = new Date();
      const checkoutDate = now.toISOString().split('T')[0];
      const actualCheckoutTime = now.toISOString();

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_out',
          check_out_date: checkoutDate,
          actual_check_out_time: actualCheckoutTime,
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update room status to cleaning
      await supabase
        .from('rooms')
        .update({ status: 'cleaning' })
        .eq('id', booking.room_id);

      // Log room status change
      await supabase
        .from('room_status_log')
        .insert([{
          room_id: booking.room_id,
          booking_id: bookingId,
          status: 'cleaning',
        }]);

      await fetchBookings();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const markRoomCleaned = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId);

      if (error) throw error;

      // Update the latest cleaning log
      const { data: latestLog } = await supabase
        .from('room_status_log')
        .select('id')
        .eq('room_id', roomId)
        .eq('status', 'cleaning')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestLog) {
        await supabase
          .from('room_status_log')
          .update({
            status: 'available',
            cleaned_at: new Date().toISOString(),
          })
          .eq('id', latestLog.id);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const extendBooking = async (
    bookingId: string,
    additionalDays: number,
    dailyRate: number,
    gstRate: number,
    paymentData?: { qrAmount: number; cashAmount: number }
  ) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      if (!booking.check_out_date) {
        throw new Error('Cannot extend booking without checkout date');
      }

      // Calculate additional charges
      const additionalBaseAmount = dailyRate * additionalDays;
      const additionalGstAmount = (additionalBaseAmount * gstRate) / 100;
      const additionalTotalAmount = additionalBaseAmount + additionalGstAmount;

      // Get payment amounts for extension
      const extensionQrAmount = paymentData?.qrAmount || 0;
      const extensionCashAmount = paymentData?.cashAmount || 0;
      const extensionPaymentTotal = extensionQrAmount + extensionCashAmount;

      // If payment data is provided, use it; otherwise assume full payment (for backward compatibility)
      const actualPayment = paymentData ? extensionPaymentTotal : additionalTotalAmount;
      const actualQrAmount = paymentData ? extensionQrAmount : 0;
      const actualCashAmount = paymentData ? extensionCashAmount : additionalTotalAmount;

      // Calculate new checkout date
      const currentCheckout = new Date(booking.check_out_date);
      currentCheckout.setDate(currentCheckout.getDate() + additionalDays);
      const newCheckoutDate = currentCheckout.toISOString().split('T')[0];

      // Update booking - track extension amount separately and update payment breakdown
      const newQrAmount = Number(booking.qr_amount || 0) + actualQrAmount;
      const newCashAmount = Number(booking.cash_amount || 0) + actualCashAmount;
      const newAmountPaid = Number(booking.amount_paid) + actualPayment;
      const newExtendedAmount = Number(booking.extended_amount || 0) + additionalTotalAmount;

      // Determine payment method
      let paymentMethod: 'cash' | 'qr' | 'mixed' = booking.payment_method || 'cash';
      if (newQrAmount > 0 && newCashAmount > 0) {
        paymentMethod = 'mixed';
      } else if (newQrAmount > 0) {
        paymentMethod = 'qr';
      } else if (newCashAmount > 0) {
        paymentMethod = 'cash';
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          check_out_date: newCheckoutDate,
          base_amount: Number(booking.base_amount) + additionalBaseAmount,
          gst_amount: Number(booking.gst_amount) + additionalGstAmount,
          total_amount: Number(booking.total_amount) + additionalTotalAmount,
          amount_paid: newAmountPaid,
          qr_amount: newQrAmount,
          cash_amount: newCashAmount,
          extended_amount: newExtendedAmount,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
      return { error: null, additionalAmount: additionalTotalAmount };
    } catch (err: any) {
      return { error: err.message, additionalAmount: 0 };
    }
  };

  const confirmAdvanceBooking = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const today = new Date().toISOString().split('T')[0];
      if (booking.check_in_date > today) {
        throw new Error('Cannot confirm advance booking before check-in date');
      }

      // Update booking status to checked_in
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          actual_check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update room status to occupied
      await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', booking.room_id);

      // Log room status change
      await supabase
        .from('room_status_log')
        .insert([{
          room_id: booking.room_id,
          booking_id: bookingId,
          status: 'occupied',
        }]);

      await fetchBookings();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const getReservedBookings = () => {
    return bookings.filter(b => b.status === 'reserved');
  };

  const updatePayment = async (
    bookingId: string,
    paymentData: { qrAmount: number; cashAmount: number }
  ) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const additionalQrAmount = paymentData.qrAmount || 0;
      const additionalCashAmount = paymentData.cashAmount || 0;
      const additionalAmount = additionalQrAmount + additionalCashAmount;

      const newQrAmount = Number(booking.qr_amount || 0) + additionalQrAmount;
      const newCashAmount = Number(booking.cash_amount || 0) + additionalCashAmount;
      const newAmountPaid = Number(booking.amount_paid) + additionalAmount;
      
      // Ensure amount_paid doesn't exceed total_amount
      const finalAmountPaid = Math.min(newAmountPaid, Number(booking.total_amount));
      const maxAdditional = finalAmountPaid - Number(booking.amount_paid);
      
      // Adjust if we exceeded the limit
      let finalQrAmount = newQrAmount;
      let finalCashAmount = newCashAmount;
      if (additionalAmount > maxAdditional) {
        const ratio = maxAdditional / additionalAmount;
        finalQrAmount = Number(booking.qr_amount || 0) + (additionalQrAmount * ratio);
        finalCashAmount = Number(booking.cash_amount || 0) + (additionalCashAmount * ratio);
      }

      // Determine payment method
      let paymentMethod: 'cash' | 'qr' | 'mixed' = booking.payment_method || 'cash';
      if (finalQrAmount > 0 && finalCashAmount > 0) {
        paymentMethod = 'mixed';
      } else if (finalQrAmount > 0) {
        paymentMethod = 'qr';
      } else if (finalCashAmount > 0) {
        paymentMethod = 'cash';
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          amount_paid: finalAmountPaid,
          qr_amount: finalQrAmount,
          cash_amount: finalCashAmount,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const cancelAdvanceBooking = async (
    bookingId: string,
    cancellationCharge: number
  ) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      if (booking.status !== 'reserved') {
        throw new Error('Only reserved (advance) bookings can be cancelled');
      }

      const advancePayment = Number(booking.amount_paid || 0);
      const refundAmount = Math.max(0, advancePayment - cancellationCharge);

      // Update booking with cancellation details
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_charge: cancellationCharge,
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Update room status to available (since reservation is released)
      await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', booking.room_id);

      // Log room status change
      await supabase
        .from('room_status_log')
        .insert([{
          room_id: booking.room_id,
          booking_id: bookingId,
          status: 'available',
          notes: 'Booking cancelled - room available',
        }]);

      // Note: Guest records are preserved even with full refund for record-keeping
      // This allows tracking refund history and prevents disputes

      await fetchBookings();
      return { error: null, refundAmount };
    } catch (err: any) {
      return { error: err.message, refundAmount: 0 };
    }
  };

  const getCancelledBookings = () => {
    return bookings.filter(b => b.status === 'cancelled');
  };

  const updateAdvanceBooking = async (
    bookingId: string,
    bookingData: {
      room_id: string;
      check_in_date: string;
      check_out_date?: string | null;
      number_of_guests: number;
      base_amount: number;
      gst_rate: number;
      gst_amount: number;
      total_amount: number;
      amount_paid: number;
      qr_amount: number;
      cash_amount: number;
      payment_method: 'cash' | 'qr' | 'mixed';
    }
  ) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      if (booking.status !== 'reserved') {
        throw new Error('Only reserved (advance) bookings can be edited');
      }

      // Check if room is being changed
      const roomChanged = booking.room_id !== bookingData.room_id;
      
      // If room changed, update old room status and new room status
      if (roomChanged) {
        // Set old room to available (if it's not occupied by another booking)
        const oldRoomBookings = bookings.filter(
          b => b.room_id === booking.room_id && 
          b.status === 'reserved' && 
          b.id !== bookingId
        );
        if (oldRoomBookings.length === 0) {
          await supabase
            .from('rooms')
            .update({ status: 'available' })
            .eq('id', booking.room_id);
        }

        // Check if new room is available
        const { data: newRoom } = await supabase
          .from('rooms')
          .select('status')
          .eq('id', bookingData.room_id)
          .single();

        if (newRoom && (newRoom.status === 'cleaning' || newRoom.status === 'maintenance')) {
          throw new Error('Selected room is not available for advance booking');
        }
      }

      // Update booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          room_id: bookingData.room_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date || null,
          number_of_guests: bookingData.number_of_guests,
          base_amount: bookingData.base_amount,
          gst_rate: bookingData.gst_rate,
          gst_amount: bookingData.gst_amount,
          total_amount: bookingData.total_amount,
          amount_paid: bookingData.amount_paid,
          qr_amount: bookingData.qr_amount,
          cash_amount: bookingData.cash_amount,
          payment_method: bookingData.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      await fetchBookings();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    bookings,
    activeBookings: getActiveBookings(),
    reservedBookings: getReservedBookings(),
    cancelledBookings: getCancelledBookings(),
    loading,
    error,
    createBooking,
    checkOut,
    markRoomCleaned,
    extendBooking,
    confirmAdvanceBooking,
    updatePayment,
    cancelAdvanceBooking,
    updateAdvanceBooking,
    getActiveBookingByRoom,
    refetch: fetchBookings,
  };
}

