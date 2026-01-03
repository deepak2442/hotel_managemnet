import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Room } from '../../lib/types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  floor: z.enum(['ground', 'first', 'cottage']),
  room_type: z.enum(['standard', 'deluxe', 'cottage', 'dormitory']),
  max_occupancy: z.number().min(1).max(10),
  status: z.enum(['available', 'occupied', 'cleaning', 'maintenance']),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  room?: Room | null;
  onSubmit: (data: RoomFormData) => Promise<{ error: string | null }>;
  onCancel: () => void;
}

export function RoomForm({ room, onSubmit, onCancel }: RoomFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room
      ? {
          room_number: room.room_number,
          floor: room.floor,
          room_type: room.room_type,
          max_occupancy: room.max_occupancy,
          status: room.status,
        }
      : {
          floor: 'ground',
          room_type: 'standard',
          max_occupancy: 2,
          status: 'available',
        },
  });

  const onFormSubmit = async (data: RoomFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: submitError } = await onSubmit(data);
      if (submitError) {
        setError(submitError);
      } else {
        setSuccess(true);
        // Auto-close after 1.5 seconds on success
        setTimeout(() => {
          onCancel();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Room {room ? 'updated' : 'created'} successfully!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-5">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Input
                label="Room Number *"
                placeholder="e.g., 101, 15A"
                {...register('room_number')}
                error={errors.room_number?.message}
                disabled={submitting}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor *
              </label>
              <select
                {...register('floor')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                disabled={submitting}
              >
                <option value="ground">Ground Floor</option>
                <option value="first">First Floor</option>
                <option value="cottage">Cottage</option>
              </select>
              {errors.floor && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.floor.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type *
              </label>
              <select
                {...register('room_type')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                disabled={submitting}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="cottage">Cottage</option>
                <option value="dormitory">Dormitory</option>
              </select>
              {errors.room_type && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.room_type.message}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Max Occupancy *"
                type="number"
                min={1}
                max={10}
                placeholder="Number of guests"
                {...register('max_occupancy', { valueAsNumber: true })}
                error={errors.max_occupancy?.message}
                disabled={submitting}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-5">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Room Status
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              disabled={submitting}
            >
              <option value="available">Available (Green)</option>
              <option value="occupied">Occupied (Red)</option>
              <option value="cleaning">Cleaning (Yellow)</option>
              <option value="maintenance">Maintenance (Gray)</option>
            </select>
            {errors.status && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.status.message}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Room status determines the color displayed on the room card
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2.5"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 min-w-[140px]"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {room ? 'Update Room' : 'Create Room'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

