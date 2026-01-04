import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CheckInFormData, Room } from '../../lib/types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useGuests } from '../../hooks/useGuests';
import { useBookings } from '../../hooks/useBookings';
import { useSettings } from '../../hooks/useSettings';
import { calculateGST, calculateTotal, formatCurrency } from '../../lib/utils';
import { normalizeCheckInDate, calculateDefaultCheckoutDate, getTodayDate } from '../../lib/billingUtils';

const checkInSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  address: z.string().min(1, 'Address is required'),
  proofType: z.enum(['aadhar', 'pan', 'driving_license']),
  proofNumber: z.string().min(1, 'Proof number is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  numberOfGuests: z.number().min(1).max(2),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  actualCheckInTime: z.string().optional(),
  checkOutDate: z.string().optional(),
  baseAmount: z.number().min(0, 'Base amount must be positive'),
  gstRate: z.number().min(0).max(100),
  amountPaid: z.number().min(0, 'Amount paid must be positive'),
});

interface CheckInFormProps {
  room: Room;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckInForm({ room, onSuccess, onCancel }: CheckInFormProps) {
  const { createGuest } = useGuests();
  const { createBooking } = useBookings();
  const { getGSTRate } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyGST, setApplyGST] = useState(true); // Toggle for GST

  const defaultGSTRate = getGSTRate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckInFormData & { actualCheckInTime?: string }>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      proofType: 'aadhar',
      numberOfGuests: 1,
      checkInDate: getTodayDate(),
      actualCheckInTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
      baseAmount: 0,
      gstRate: defaultGSTRate,
      amountPaid: 0,
    },
  });

  const checkInDate = watch('checkInDate');

  // Auto-calculate checkout date when check-in date changes
  useEffect(() => {
    if (checkInDate) {
      const defaultCheckout = calculateDefaultCheckoutDate(checkInDate);
      setValue('checkOutDate', defaultCheckout);
    }
  }, [checkInDate, setValue]);

  const baseAmount = watch('baseAmount');
  const gstRate = watch('gstRate');
  
  // Calculate GST only if applyGST is enabled
  const effectiveGSTRate = applyGST ? (gstRate || defaultGSTRate) : 0;
  const gstAmount = applyGST ? calculateGST(baseAmount || 0, effectiveGSTRate) : 0;
  const totalAmount = calculateTotal(baseAmount || 0, gstAmount);

  useEffect(() => {
    if (applyGST) {
      setValue('gstRate', defaultGSTRate);
    } else {
      setValue('gstRate', 0);
    }
  }, [defaultGSTRate, applyGST, setValue]);

  const onSubmit = async (data: CheckInFormData & { actualCheckInTime?: string }) => {
    // Check if it's an advance booking
    const today = new Date().toISOString().split('T')[0];
    const isAdvanceBooking = data.checkInDate > today;

    // For advance bookings, room can be available or occupied (but not cleaning/maintenance)
    // For immediate check-ins, room must be available
    if (!isAdvanceBooking && room.status !== 'available') {
      setError('Room is not available for check-in');
      return;
    }

    if (isAdvanceBooking && (room.status === 'cleaning' || room.status === 'maintenance')) {
      setError('Room is not available for advance booking');
      return;
    }

    if (data.numberOfGuests > room.max_occupancy) {
      setError(`Maximum ${room.max_occupancy} guests allowed in this room`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create guest
      const { data: guestData, error: guestError } = await createGuest({
        name: data.guestName,
        address: data.address,
        proof_type: data.proofType,
        proof_number: data.proofNumber,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });

      if (guestError || !guestData) {
        throw new Error(guestError || 'Failed to create guest');
      }

      // For advance bookings, use the selected check-in date directly
      // For immediate check-ins, normalize to today at 12:00 PM
      const normalizedCheckInDate = isAdvanceBooking 
        ? data.checkInDate 
        : normalizeCheckInDate(
            data.actualCheckInTime ? new Date(data.actualCheckInTime) : new Date()
          );
      
      // Calculate default checkout if not provided
      const checkoutDate = data.checkOutDate || calculateDefaultCheckoutDate(normalizedCheckInDate);
      
      // Store actual check-in time
      // For advance bookings, leave it null (will be set when confirmed)
      // For immediate check-ins, use provided time or current time
      const actualCheckInTimestamp = isAdvanceBooking
        ? null
        : (data.actualCheckInTime
            ? new Date(data.actualCheckInTime).toISOString()
            : new Date().toISOString());

      // Create booking
      // Use effective GST values (0 if GST is disabled)
      const finalGSTRate = applyGST ? data.gstRate : 0;
      const finalGSTAmount = applyGST ? gstAmount : 0;
      const finalTotalAmount = applyGST ? totalAmount : (data.baseAmount || 0);

      const { error: bookingError } = await createBooking({
        room_id: room.id,
        guest_id: guestData.id,
        check_in_date: normalizedCheckInDate,
        check_out_date: checkoutDate,
        actual_check_in_time: actualCheckInTimestamp,
        number_of_guests: data.numberOfGuests,
        base_amount: data.baseAmount,
        gst_rate: finalGSTRate,
        gst_amount: finalGSTAmount,
        total_amount: finalTotalAmount,
        amount_paid: data.amountPaid,
        isAdvanceBooking,
      });

      if (bookingError) {
        throw new Error(bookingError);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
        <p className="font-medium text-blue-900">Room: {room.room_number} ({room.room_type})</p>
        <p className="text-sm text-blue-700">Max Occupancy: {room.max_occupancy} guests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Guest Name *"
          {...register('guestName')}
          error={errors.guestName?.message}
        />
        <Input
          label="Number of Guests *"
          type="number"
          min={1}
          max={room.max_occupancy}
          {...register('numberOfGuests', { valueAsNumber: true })}
          error={errors.numberOfGuests?.message}
        />
      </div>

      <Input
        label="Address *"
        {...register('address')}
        error={errors.address?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof Type *
          </label>
          <select
            {...register('proofType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="aadhar">Aadhar</option>
            <option value="pan">PAN</option>
            <option value="driving_license">Driving License</option>
          </select>
        </div>
        <Input
          label="Proof Number *"
          {...register('proofNumber')}
          error={errors.proofNumber?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
        <p className="text-sm text-yellow-800">
          <strong>24-Hour Billing:</strong> Check-in is normalized to 12:00 PM (noon) for billing purposes. 
          Checkout is by default next day at 12:00 PM. If checkout is after 12:00 PM, it's charged as 2 days.
        </p>
        {checkInDate && checkInDate > new Date().toISOString().split('T')[0] && (
          <p className="text-sm text-blue-800 mt-2 font-semibold">
            ⚠️ This is an <strong>Advance Booking</strong>. Advance payment will be collected now.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Check-in Date *"
          type="date"
          min={getTodayDate()}
          {...register('checkInDate')}
          error={errors.checkInDate?.message}
        />
        {checkInDate && checkInDate <= new Date().toISOString().split('T')[0] && (
          <Input
            label="Actual Arrival Time (Optional)"
            type="datetime-local"
            {...register('actualCheckInTime')}
            error={errors.actualCheckInTime?.message}
          />
        )}
        {checkInDate && checkInDate > new Date().toISOString().split('T')[0] && (
          <div className="text-sm text-gray-600 pt-8">
            <p className="font-medium">Advance Booking:</p>
            <p>Room will be reserved. Guest will check in on {checkInDate}.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Check-out Date *"
          type="date"
          {...register('checkOutDate')}
          error={errors.checkOutDate?.message}
        />
        <div className="text-sm text-gray-600 pt-8">
          <p className="font-medium">Billing Check-in:</p>
          <p>{checkInDate ? `${checkInDate} at 12:00 PM` : 'Not set'}</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        {/* GST Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyGST}
              onChange={(e) => setApplyGST(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Apply GST</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Base Amount (₹) *"
            type="number"
            step="0.01"
            min={0}
            {...register('baseAmount', { valueAsNumber: true })}
            error={errors.baseAmount?.message}
          />
          {applyGST && (
            <Input
              label="GST Rate (%) *"
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...register('gstRate', { valueAsNumber: true })}
              error={errors.gstRate?.message}
            />
          )}
          {!applyGST && (
            <div className="text-sm text-gray-600 pt-8">
              <p className="font-medium">GST:</p>
              <p>Not Applied</p>
            </div>
          )}
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Base Amount:</span>
            <span>{formatCurrency(baseAmount || 0)}</span>
          </div>
          {applyGST && (
            <div className="flex justify-between">
              <span className="font-medium">GST ({effectiveGSTRate}%):</span>
              <span>{formatCurrency(gstAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Amount:</span>
            <span>{formatCurrency(applyGST ? totalAmount : (baseAmount || 0))}</span>
          </div>
        </div>

        <div className="mt-4">
          <Input
            label="Amount Paid (₹) *"
            type="number"
            step="0.01"
            min={0}
            {...register('amountPaid', { valueAsNumber: true })}
            error={errors.amountPaid?.message}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting 
            ? 'Processing...' 
            : checkInDate && checkInDate > new Date().toISOString().split('T')[0]
            ? 'Create Advance Booking'
            : 'Check In Guest'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

