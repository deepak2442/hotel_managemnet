import { useState } from 'react';
import type { Booking } from '../../lib/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatCurrency, formatDate } from '../../lib/utils';

interface CancelBookingModalProps {
  booking: Booking;
  onConfirm: (cancellationCharge: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CancelBookingModal({ booking, onConfirm, onCancel, loading }: CancelBookingModalProps) {
  const [cancellationCharge, setCancellationCharge] = useState('');
  const [error, setError] = useState<string | null>(null);

  const advancePayment = Number(booking.amount_paid || 0);
  const qrAmount = Number(booking.qr_amount || 0);
  const cashAmount = Number(booking.cash_amount || 0);
  const charge = parseFloat(cancellationCharge) || 0;
  const refundAmount = Math.max(0, advancePayment - charge);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const chargeAmount = parseFloat(cancellationCharge) || 0;

    if (chargeAmount < 0) {
      setError('Cancellation charge cannot be negative');
      return;
    }

    if (chargeAmount > advancePayment) {
      setError(`Cancellation charge cannot exceed advance payment of ${formatCurrency(advancePayment)}`);
      return;
    }

    onConfirm(chargeAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {booking.guest && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">Booking Information</h3>
          <p><span className="font-medium">Guest:</span> {booking.guest.name}</p>
          <p><span className="font-medium">Room:</span> {booking.room?.room_number}</p>
          <p><span className="font-medium">Check-in Date:</span> {formatDate(booking.check_in_date)}</p>
          <p><span className="font-medium">Check-out Date:</span> {booking.check_out_date ? formatDate(booking.check_out_date) : 'Not set'}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
        <h3 className="font-semibold text-gray-900">Payment Summary</h3>
        <div className="flex justify-between">
          <span>Advance Payment:</span>
          <span className="font-medium">{formatCurrency(advancePayment)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">  └ QR: {formatCurrency(qrAmount)}</span>
          <span className="text-gray-600">Cash: {formatCurrency(cashAmount)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="cancellationCharge" className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Charge (₹) *
          </label>
          <Input
            id="cancellationCharge"
            type="number"
            step="0.01"
            min="0"
            value={cancellationCharge}
            onChange={(e) => {
              setCancellationCharge(e.target.value);
              setError(null);
            }}
            placeholder="0.00"
            error={error || undefined}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter 0 for full refund (no cancellation charge)
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Refund Calculation</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Advance Payment:</span>
              <span>{formatCurrency(advancePayment)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancellation Charge:</span>
              <span className={charge > 0 ? 'text-red-600 font-medium' : ''}>
                {formatCurrency(charge)}
              </span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Refund Amount:</span>
              <span className="text-green-600">{formatCurrency(refundAmount)}</span>
            </div>
          </div>
          {charge === 0 && (
            <p className="text-sm text-blue-700 mt-2 font-medium">
              ✓ Full refund - Guest record will be preserved for refund history
            </p>
          )}
          {charge > 0 && (
            <p className="text-sm text-yellow-700 mt-2">
              ⚠️ Cancellation charge applied - Refund amount will be recorded
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="danger"
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Confirm Cancellation'}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

