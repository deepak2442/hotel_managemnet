import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../lib/types';

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
    isAdvanceBooking?: boolean;
  }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const checkInDate = bookingData.check_in_date;
      const isAdvance = bookingData.isAdvanceBooking || checkInDate > today;
      
      // Determine booking status
      const status = isAdvance ? 'reserved' : 'checked_in';

      // Extract isAdvanceBooking from bookingData to avoid inserting it into database
      const { isAdvanceBooking: _, ...dbBookingData } = bookingData;

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...dbBookingData,
          check_out_date: dbBookingData.check_out_date || null,
          actual_check_in_time: dbBookingData.actual_check_in_time || null,
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
    gstRate: number
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

      // Calculate new checkout date
      const currentCheckout = new Date(booking.check_out_date);
      currentCheckout.setDate(currentCheckout.getDate() + additionalDays);
      const newCheckoutDate = currentCheckout.toISOString().split('T')[0];

      // Update booking
      const { error } = await supabase
        .from('bookings')
        .update({
          check_out_date: newCheckoutDate,
          base_amount: Number(booking.base_amount) + additionalBaseAmount,
          gst_amount: Number(booking.gst_amount) + additionalGstAmount,
          total_amount: Number(booking.total_amount) + additionalTotalAmount,
          amount_paid: Number(booking.amount_paid) + additionalTotalAmount, // Assume full payment for extension
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

  const updatePayment = async (bookingId: string, additionalAmount: number) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const newAmountPaid = Number(booking.amount_paid) + additionalAmount;
      
      // Ensure amount_paid doesn't exceed total_amount
      const finalAmountPaid = Math.min(newAmountPaid, Number(booking.total_amount));

      const { error } = await supabase
        .from('bookings')
        .update({
          amount_paid: finalAmountPaid,
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

  return {
    bookings,
    activeBookings: getActiveBookings(),
    reservedBookings: getReservedBookings(),
    loading,
    error,
    createBooking,
    checkOut,
    markRoomCleaned,
    extendBooking,
    confirmAdvanceBooking,
    updatePayment,
    getActiveBookingByRoom,
    refetch: fetchBookings,
  };
}

