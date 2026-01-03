import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useGuests() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGuest = async (guestData: {
    name: string;
    address: string;
    proof_type: string;
    proof_number: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('guests')
        .insert([guestData])
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

  return { createGuest, loading, error };
}

