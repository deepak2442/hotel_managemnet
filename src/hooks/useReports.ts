import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../lib/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';

interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  bookings: Booking[];
}

interface DailyReportData extends ReportData {
  date: string;
}

interface MonthlyReportData extends ReportData {
  month: string;
}

export function useReports() {
  const [loading, setLoading] = useState(false);

  const getDailyReport = async (date: Date): Promise<DailyReportData> => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .gte('check_in_date', format(date, 'yyyy-MM-dd'))
        .lte('check_in_date', format(date, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.amount_paid), 0) || 0;

      // Get total rooms for occupancy calculation
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .neq('room_type', 'dormitory');

      const totalRooms = rooms?.length || 1;
      const occupiedRooms = new Set(bookings?.map(b => b.room_id) || []).size;
      const occupancyRate = (occupiedRooms / totalRooms) * 100;

      return {
        date: format(date, 'yyyy-MM-dd'),
        totalBookings,
        totalRevenue,
        occupancyRate,
        bookings: bookings || [],
      };
    } catch (err) {
      console.error('Error fetching daily report:', err);
      return {
        date: format(date, 'yyyy-MM-dd'),
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        bookings: [],
      };
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyReport = async (year: number, month: number): Promise<MonthlyReportData> => {
    setLoading(true);
    try {
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(new Date(year, month - 1));

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .gte('check_in_date', format(start, 'yyyy-MM-dd'))
        .lte('check_in_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.amount_paid), 0) || 0;

      // Calculate average occupancy for the month
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .neq('room_type', 'dormitory');

      const totalRooms = rooms?.length || 1;
      const daysInMonth = end.getDate();
      const totalRoomDays = totalRooms * daysInMonth;
      const occupiedRoomDays = bookings?.length || 0;
      const occupancyRate = (occupiedRoomDays / totalRoomDays) * 100;

      return {
        month: format(start, 'MMMM yyyy'),
        totalBookings,
        totalRevenue,
        occupancyRate,
        bookings: bookings || [],
      };
    } catch (err) {
      console.error('Error fetching monthly report:', err);
      return {
        month: format(new Date(year, month - 1), 'MMMM yyyy'),
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        bookings: [],
      };
    } finally {
      setLoading(false);
    }
  };

  const getYearlyReport = async (year: number): Promise<MonthlyReportData[]> => {
    setLoading(true);
    try {
      const start = startOfYear(new Date(year, 0));
      const end = endOfYear(new Date(year, 0));

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .gte('check_in_date', format(start, 'yyyy-MM-dd'))
        .lte('check_in_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by month
      const monthlyData: MonthlyReportData[] = [];
      const months = eachMonthOfInterval({ start, end });

      for (const month of months) {
        const monthBookings = bookings?.filter(
          b => format(new Date(b.check_in_date), 'yyyy-MM') === format(month, 'yyyy-MM')
        ) || [];

        const totalBookings = monthBookings.length;
        const totalRevenue = monthBookings.reduce((sum, b) => sum + Number(b.amount_paid), 0);

        const { data: rooms } = await supabase
          .from('rooms')
          .select('id')
          .neq('room_type', 'dormitory');

        const totalRooms = rooms?.length || 1;
        const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
        const totalRoomDays = totalRooms * daysInMonth;
        const occupiedRoomDays = monthBookings.length;
        const occupancyRate = (occupiedRoomDays / totalRoomDays) * 100;

        monthlyData.push({
          month: format(month, 'MMMM yyyy'),
          totalBookings,
          totalRevenue,
          occupancyRate,
          bookings: monthBookings,
        });
      }

      return monthlyData;
    } catch (err) {
      console.error('Error fetching yearly report:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeReport = async (startDate: Date, endDate: Date): Promise<ReportData & { dateRange: string }> => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          room:rooms(*),
          guest:guests(*)
        `)
        .gte('check_in_date', format(startDate, 'yyyy-MM-dd'))
        .lte('check_in_date', format(endDate, 'yyyy-MM-dd'))
        .order('check_in_date', { ascending: true });

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.amount_paid), 0) || 0;

      // Get total rooms for occupancy calculation
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .neq('room_type', 'dormitory');

      const totalRooms = rooms?.length || 1;
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalRoomDays = totalRooms * daysDiff;
      const occupiedRoomDays = bookings?.length || 0;
      const occupancyRate = (occupiedRoomDays / totalRoomDays) * 100;

      return {
        totalBookings,
        totalRevenue,
        occupancyRate,
        bookings: bookings || [],
        dateRange: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      };
    } catch (err) {
      console.error('Error fetching date range report:', err);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        bookings: [],
        dateRange: `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
      };
    } finally {
      setLoading(false);
    }
  };

  return { getDailyReport, getMonthlyReport, getYearlyReport, getDateRangeReport, loading };
}

