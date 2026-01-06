import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Room, Booking, Guest } from '../lib/types';

export interface MaintenanceRoomData {
  room: Room;
  booking?: Booking;
  guest?: Guest;
  checkoutTime?: string | null;
}

export interface MaintenanceReportData {
  occupiedRooms: MaintenanceRoomData[];
  cleaningRooms: MaintenanceRoomData[];
  availableRooms: MaintenanceRoomData[];
  totalOccupied: number;
  totalCleaning: number;
  totalAvailable: number;
}

export function useMaintenanceReport() {
  const [reportData, setReportData] = useState<MaintenanceReportData>({
    occupiedRooms: [],
    cleaningRooms: [],
    availableRooms: [],
    totalOccupied: 0,
    totalCleaning: 0,
    totalAvailable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaintenanceData();
    
    // Subscribe to real-time updates
    const roomsChannel = supabase
      .channel('maintenance_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          fetchMaintenanceData();
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('maintenance_bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchMaintenanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch all active bookings (checked_in) and recent checkouts (checked_out)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .in('status', ['checked_in', 'checked_out'])
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Group rooms by status
      const occupiedRooms: MaintenanceRoomData[] = [];
      const cleaningRooms: MaintenanceRoomData[] = [];
      const availableRooms: MaintenanceRoomData[] = [];

      rooms?.forEach((room) => {
        const roomData: MaintenanceRoomData = {
          room,
        };

        // Find active booking for occupied rooms
        if (room.status === 'occupied') {
          const activeBooking = bookings?.find(
            (b) => b.room_id === room.id && b.status === 'checked_in'
          );
          if (activeBooking) {
            roomData.booking = activeBooking as Booking;
            roomData.guest = activeBooking.guest;
          }
          occupiedRooms.push(roomData);
        } 
        // Find recent checkout for cleaning rooms
        else if (room.status === 'cleaning') {
          const checkoutBooking = bookings?.find(
            (b) => b.room_id === room.id && b.status === 'checked_out'
          );
          if (checkoutBooking) {
            roomData.booking = checkoutBooking as Booking;
            roomData.guest = checkoutBooking.guest;
            roomData.checkoutTime = checkoutBooking.actual_check_out_time;
          }
          cleaningRooms.push(roomData);
        } 
        // Available rooms
        else if (room.status === 'available') {
          availableRooms.push(roomData);
        }
      });

      setReportData({
        occupiedRooms,
        cleaningRooms,
        availableRooms,
        totalOccupied: occupiedRooms.length,
        totalCleaning: cleaningRooms.length,
        totalAvailable: availableRooms.length,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    reportData,
    loading,
    error,
    refetch: fetchMaintenanceData,
  };
}

