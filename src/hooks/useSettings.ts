import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Setting } from '../lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string): string | null => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || null;
  };

  const getGSTRate = (): number => {
    const rate = getSetting('gst_rate');
    return rate ? parseFloat(rate) : 18.0;
  };

  return { settings, loading, getSetting, getGSTRate };
}

