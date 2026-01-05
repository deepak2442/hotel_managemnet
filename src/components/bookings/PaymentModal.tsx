import { useState } from 'react';
import type { Booking } from '../../lib/types';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../lib/utils';

interface PaymentModalProps {
  booking: Booking;
  onConfirm: (paymentData: { qrAmount: number; cashAmount: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentModal({ booking, onConfirm, onCancel, loading }: PaymentModalProps) {
  // Determine initial payment mode from existing booking
  const getInitialPaymentMode = (): 'cash' | 'qr' | 'mixed' => {
    const qr = Number(booking.qr_amount || 0);
    const cash = Number(booking.cash_amount || 0);
    if (qr > 0 && cash > 0) return 'mixed';
    if (qr > 0) return 'qr';
    return 'cash';
  };

  const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | 'mixed'>(getInitialPaymentMode());
  const [qrAmount, setQrAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalAmount = Number(booking.total_amount);
  const amountPaid = Number(booking.amount_paid);
  const currentQrAmount = Number(booking.qr_amount || 0);
  const currentCashAmount = Number(booking.cash_amount || 0);
  const outstandingBalance = totalAmount - amountPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qr = parseFloat(qrAmount) || 0;
    const cash = parseFloat(cashAmount) || 0;
    const total = qr + cash;
    
    if (total <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    if (total > outstandingBalance) {
      setError(`Total payment amount cannot exceed outstanding balance of ${formatCurrency(outstandingBalance)}`);
      return;
    }

    onConfirm({ qrAmount: qr, cashAmount: cash });
  };

  const handleQuickFill = (percentage: number) => {
    const amount = (outstandingBalance * percentage) / 100;
    setError(null);
    
    if (paymentMode === 'cash') {
      setCashAmount(amount.toFixed(2));
      setQrAmount('');
    } else if (paymentMode === 'qr') {
      setQrAmount(amount.toFixed(2));
      setCashAmount('');
    } else {
      // Mixed: split equally
      const halfAmount = (amount / 2).toFixed(2);
      setQrAmount(halfAmount);
      setCashAmount(halfAmount);
    }
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
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">  └ QR: {formatCurrency(currentQrAmount)}</span>
          <span className="text-gray-600">Cash: {formatCurrency(currentCashAmount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Outstanding Balance:</span>
          <span className="text-red-600">{formatCurrency(outstandingBalance)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode *
          </label>
          <select
            id="paymentMode"
            value={paymentMode}
            onChange={(e) => {
              const mode = e.target.value as 'cash' | 'qr' | 'mixed';
              setPaymentMode(mode);
              // Reset amounts when mode changes
              setQrAmount('');
              setCashAmount('');
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">Cash Only</option>
            <option value="qr">QR Only</option>
            <option value="mixed">Mixed (Cash + QR)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(paymentMode === 'qr' || paymentMode === 'mixed') && (
            <div>
              <label htmlFor="qrAmount" className="block text-sm font-medium text-gray-700 mb-1">
                QR Payment (₹) *
              </label>
              <input
                id="qrAmount"
                type="number"
                step="0.01"
                min="0"
                value={qrAmount}
                onChange={(e) => {
                  setQrAmount(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          )}
          {(paymentMode === 'cash' || paymentMode === 'mixed') && (
            <div>
              <label htmlFor="cashAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Cash Payment (₹) *
              </label>
              <input
                id="cashAmount"
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => {
                  setCashAmount(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          )}
          {paymentMode === 'qr' && (
            <div className="hidden md:block"></div>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          {paymentMode === 'qr' && (
            <div className="flex justify-between text-sm mb-1">
              <span>QR Payment:</span>
              <span>{formatCurrency(parseFloat(qrAmount) || 0)}</span>
            </div>
          )}
          {paymentMode === 'cash' && (
            <div className="flex justify-between text-sm mb-1">
              <span>Cash Payment:</span>
              <span>{formatCurrency(parseFloat(cashAmount) || 0)}</span>
            </div>
          )}
          {paymentMode === 'mixed' && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>QR Payment:</span>
                <span>{formatCurrency(parseFloat(qrAmount) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cash Payment:</span>
                <span>{formatCurrency(parseFloat(cashAmount) || 0)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>Total Payment:</span>
            <span>{formatCurrency((parseFloat(qrAmount) || 0) + (parseFloat(cashAmount) || 0))}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        {outstandingBalance > 0 && (
          <div className="flex gap-2">
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

