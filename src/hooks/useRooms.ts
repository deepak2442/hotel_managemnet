import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Room } from '../lib/types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId: string, status: Room['status']) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const createRoom = async (roomData: {
    room_number: string;
    floor: Room['floor'];
    room_type: Room['room_type'];
    max_occupancy: number;
    status?: Room['status'];
  }) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          ...roomData,
          status: roomData.status || 'available',
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchRooms();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateRoom = async (roomId: string, roomData: {
    room_number?: string;
    floor?: Room['floor'];
    room_type?: Room['room_type'];
    max_occupancy?: number;
    status?: Room['status'];
  }) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          ...roomData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      await fetchRooms();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return { rooms, loading, error, updateRoomStatus, createRoom, updateRoom, refetch: fetchRooms };
}

