import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Room, ProofType } from '../../lib/types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useGuests } from '../../hooks/useGuests';
import { useBookings } from '../../hooks/useBookings';
import { useSettings } from '../../hooks/useSettings';
import { calculateGST, calculateTotal, formatCurrency } from '../../lib/utils';
import { calculateDefaultCheckoutDate } from '../../lib/billingUtils';

type AdvanceBookingFormData = {
  roomId: string;
  guestName: string;
  address: string;
  proofType?: ProofType;
  proofNumber?: string;
  phone?: string;
  email?: string;
  numberOfGuests: number;
  checkInDate: string;
  checkOutDate?: string;
  baseAmount: number;
  gstRate: number;
  amountPaid: number;
};

const advanceBookingSchema = z.object({
  roomId: z.string().min(1, 'Room selection is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  address: z.string().min(1, 'Address is required'),
  proofType: z.enum(['aadhar', 'pan', 'driving_license']).optional(),
  proofNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  numberOfGuests: z.number().min(1),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().optional(),
  baseAmount: z.number().min(0, 'Base amount must be positive'),
  gstRate: z.number().min(0).max(100),
  amountPaid: z.number().min(0, 'Amount paid must be positive'),
}).refine((data) => {
  const today = new Date().toISOString().split('T')[0];
  return data.checkInDate > today;
}, {
  message: 'Check-in date must be in the future',
  path: ['checkInDate'],
}).refine((data) => {
  // If proofNumber is provided, proofType must also be provided
  if (data.proofNumber && !data.proofType) {
    return false;
  }
  // If proofType is provided, proofNumber must also be provided
  if (data.proofType && !data.proofNumber) {
    return false;
  }
  return true;
}, {
  message: 'Both proof type and proof number must be provided together, or both left empty',
  path: ['proofNumber'],
});

interface AdvanceBookingFormProps {
  rooms: Room[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdvanceBookingForm({ rooms, onSuccess, onCancel }: AdvanceBookingFormProps) {
  const { createGuest } = useGuests();
  const { createBooking } = useBookings();
  const { getGSTRate } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyGST, setApplyGST] = useState(true);

  const defaultGSTRate = getGSTRate();

  // Filter rooms - exclude cleaning and maintenance
  const availableRooms = rooms.filter(
    r => r.status !== 'cleaning' && r.status !== 'maintenance'
  );

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdvanceBookingFormData>({
    resolver: zodResolver(advanceBookingSchema),
    defaultValues: {
      roomId: '',
      proofType: undefined,
      proofNumber: '',
      numberOfGuests: 1,
      checkInDate: getTomorrowDate(),
      baseAmount: 0,
      gstRate: defaultGSTRate,
      amountPaid: 0,
    },
  });

  const selectedRoomId = watch('roomId');
  const selectedRoom = availableRooms.find(r => r.id === selectedRoomId);
  const checkInDate = watch('checkInDate');
  const baseAmount = watch('baseAmount');
  const gstRate = watch('gstRate');

  // Auto-calculate checkout date when check-in date changes
  useEffect(() => {
    if (checkInDate) {
      const defaultCheckout = calculateDefaultCheckoutDate(checkInDate);
      setValue('checkOutDate', defaultCheckout);
    }
  }, [checkInDate, setValue]);

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

  const onSubmit = async (data: AdvanceBookingFormData) => {
    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }

    // Validate check-in date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (data.checkInDate <= today) {
      setError('Check-in date must be in the future for advance bookings');
      return;
    }

    // Validate number of guests
    if (data.numberOfGuests > selectedRoom.max_occupancy) {
      setError(`Maximum ${selectedRoom.max_occupancy} guests allowed in this room`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create guest
      // Handle empty strings from form fields
      const proofType = data.proofType && data.proofType.trim() !== '' ? data.proofType : undefined;
      const proofNumber = data.proofNumber && data.proofNumber.trim() !== '' ? data.proofNumber : undefined;
      
      const { data: guestData, error: guestError } = await createGuest({
        name: data.guestName,
        address: data.address,
        proof_type: proofType,
        proof_number: proofNumber,
        phone: data.phone && data.phone.trim() !== '' ? data.phone : undefined,
        email: data.email && data.email.trim() !== '' ? data.email : undefined,
      });

      if (guestError || !guestData) {
        throw new Error(guestError || 'Failed to create guest');
      }

      // Calculate default checkout if not provided
      const checkoutDate = data.checkOutDate || calculateDefaultCheckoutDate(data.checkInDate);

      // Create booking - always as advance booking
      const finalGSTRate = applyGST ? data.gstRate : 0;
      const finalGSTAmount = applyGST ? gstAmount : 0;
      const finalTotalAmount = applyGST ? totalAmount : (data.baseAmount || 0);

      const { error: bookingError } = await createBooking({
        room_id: selectedRoom.id,
        guest_id: guestData.id,
        check_in_date: data.checkInDate,
        check_out_date: checkoutDate,
        actual_check_in_time: null, // Will be set when confirmed
        number_of_guests: data.numberOfGuests,
        base_amount: data.baseAmount,
        gst_rate: finalGSTRate,
        gst_amount: finalGSTAmount,
        total_amount: finalTotalAmount,
        amount_paid: data.amountPaid,
        isAdvanceBooking: true,
      });

      if (bookingError) {
        throw new Error(bookingError);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create advance booking');
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

      <div className="bg-purple-50 border border-purple-200 p-4 rounded mb-4">
        <p className="font-medium text-purple-900">📅 Advance Booking</p>
        <p className="text-sm text-purple-700">This booking will be reserved for a future date</p>
      </div>

      {/* Room Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Room *
        </label>
        <select
          {...register('roomId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Room --</option>
          {availableRooms.map((room) => (
            <option key={room.id} value={room.id}>
              Room {room.room_number} - {room.room_type} ({room.floor}) - {room.status}
            </option>
          ))}
        </select>
        {errors.roomId && (
          <p className="mt-1 text-sm text-red-600">{errors.roomId.message}</p>
        )}
        {selectedRoom && (
          <div className="mt-2 bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Selected:</span> Room {selectedRoom.room_number} ({selectedRoom.room_type})
            </p>
            <p className="text-sm text-blue-700">Max Occupancy: {selectedRoom.max_occupancy} guests</p>
          </div>
        )}
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
          max={selectedRoom?.max_occupancy || 2}
          {...register('numberOfGuests', { valueAsNumber: true })}
          error={errors.numberOfGuests?.message}
        />
      </div>

      <Input
        label="Address *"
        {...register('address')}
        error={errors.address?.message}
      />

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> ID proof is optional for advance bookings. Guest will provide proof at check-in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof Type (Optional)
          </label>
          <select
            {...register('proofType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Not provided yet --</option>
            <option value="aadhar">Aadhar</option>
            <option value="pan">PAN</option>
            <option value="driving_license">Driving License</option>
          </select>
        </div>
        <Input
          label="Proof Number (Optional)"
          {...register('proofNumber')}
          error={errors.proofNumber?.message}
          placeholder="Will be provided at check-in"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Check-in Date *"
          type="date"
          min={getTomorrowDate()}
          {...register('checkInDate')}
          error={errors.checkInDate?.message}
        />
        <Input
          label="Check-out Date *"
          type="date"
          {...register('checkOutDate')}
          error={errors.checkOutDate?.message}
        />
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
            label="Advance Amount Paid (₹) *"
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
          {submitting ? 'Creating...' : 'Create Advance Booking'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

