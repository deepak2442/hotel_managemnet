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
  }) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...bookingData,
          check_out_date: bookingData.check_out_date || null,
          actual_check_in_time: bookingData.actual_check_in_time || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update room status to occupied
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

  return {
    bookings,
    activeBookings: getActiveBookings(),
    loading,
    error,
    createBooking,
    checkOut,
    markRoomCleaned,
    getActiveBookingByRoom,
    refetch: fetchBookings,
  };
}

