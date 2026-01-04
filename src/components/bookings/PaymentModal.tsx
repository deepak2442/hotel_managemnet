import { useState } from 'react';
import type { Booking } from '../../lib/types';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PaymentModalProps {
  booking: Booking;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentModal({ booking, onConfirm, onCancel, loading }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalAmount = Number(booking.total_amount);
  const amountPaid = Number(booking.amount_paid);
  const outstandingBalance = totalAmount - amountPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (amount > outstandingBalance) {
      setError(`Payment amount cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}`);
      return;
    }

    onConfirm(amount);
  };

  const handleQuickFill = (percentage: number) => {
    const amount = (outstandingBalance * percentage) / 100;
    setPaymentAmount(amount.toFixed(2));
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {booking.guest && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">Guest Information</h3>
          <p><span className="font-medium">Name:</span> {booking.guest.name}</p>
          <p><span className="font-medium">Room:</span> {booking.room?.room_number}</p>
          <p><span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}</p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="font-semibold text-gray-900">Payment Summary</h3>
        <div className="flex justify-between">
          <span>Total Amount:</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span className="text-green-600">{formatCurrency(amountPaid)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Outstanding Balance:</span>
          <span className="text-red-600">{formatCurrency(outstandingBalance)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
          Payment Amount
        </label>
        <input
          id="paymentAmount"
          type="number"
          step="0.01"
          min="0"
          max={outstandingBalance}
          value={paymentAmount}
          onChange={(e) => {
            setPaymentAmount(e.target.value);
            setError(null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter amount to pay"
          required
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {outstandingBalance > 0 && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleQuickFill(25)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill(50)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill(100)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            >
              Full
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="primary"
          type="submit"
          disabled={loading || outstandingBalance === 0}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Add Payment'}
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

