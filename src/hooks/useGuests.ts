import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useGuests() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGuest = async (guestData: {
    name: string;
    address: string;
    proof_type?: string;
    proof_number?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      // Prepare data - convert undefined to null for optional fields
      const insertData = {
        name: guestData.name,
        address: guestData.address,
        proof_type: guestData.proof_type || null,
        proof_number: guestData.proof_number || null,
        phone: guestData.phone || null,
        email: guestData.email || null,
      };
      const { data, error } = await supabase
        .from('guests')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (guestId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateGuest = async (
    guestId: string,
    guestData: {
      name?: string;
      address?: string;
      proof_type?: string | null;
      proof_number?: string | null;
      phone?: string | null;
      email?: string | null;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('guests')
        .update(guestData)
        .eq('id', guestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createGuest, updateGuest, deleteGuest, loading, error };
}

