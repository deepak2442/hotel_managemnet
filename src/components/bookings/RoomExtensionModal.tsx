import { useState, useEffect } from 'react';
import type { Booking } from '../../lib/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatCurrency, formatDate, calculateGST, calculateTotal } from '../../lib/utils';
import { useSettings } from '../../hooks/useSettings';

interface RoomExtensionModalProps {
  booking: Booking;
  onConfirm: (additionalDays: number, dailyRate: number, additionalAmount: number, paymentData: { qrAmount: number; cashAmount: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RoomExtensionModal({ booking, onConfirm, onCancel, loading }: RoomExtensionModalProps) {
  const { getGSTRate } = useSettings();
  const [additionalDays, setAdditionalDays] = useState(1);
  const [dailyRate, setDailyRate] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | 'mixed'>('cash');
  const [qrAmount, setQrAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const defaultGSTRate = getGSTRate();

  // Calculate daily rate from existing booking if checkout date exists
  useEffect(() => {
    if (booking.check_out_date && booking.check_in_date) {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        // Calculate daily rate from base amount
        const calculatedDailyRate = Number(booking.base_amount) / days;
        setDailyRate(calculatedDailyRate);
      } else {
        // If same day, use base amount as daily rate
        setDailyRate(Number(booking.base_amount));
      }
    } else {
      // Fallback to base amount
      setDailyRate(Number(booking.base_amount));
    }
  }, [booking]);

  const additionalBaseAmount = dailyRate * additionalDays;
  const additionalGstAmount = calculateGST(additionalBaseAmount, defaultGSTRate);
  const additionalTotalAmount = calculateTotal(additionalBaseAmount, additionalGstAmount);

  // Calculate new checkout date
  const newCheckoutDate = booking.check_out_date
    ? (() => {
        const currentCheckout = new Date(booking.check_out_date);
        currentCheckout.setDate(currentCheckout.getDate() + additionalDays);
        return currentCheckout.toISOString().split('T')[0];
      })()
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (additionalDays < 1) {
      setError('Please enter at least 1 additional day');
      return;
    }
    if (dailyRate <= 0) {
      setError('Please enter a valid daily rate');
      return;
    }
    
    const qr = parseFloat(qrAmount) || 0;
    const cash = parseFloat(cashAmount) || 0;
    const total = qr + cash;
    
    if (total <= 0) {
      setError('Please enter payment amount (QR or Cash)');
      return;
    }
    
    if (total > additionalTotalAmount) {
      setError(`Total payment (${formatCurrency(total)}) cannot exceed extension amount (${formatCurrency(additionalTotalAmount)})`);
      return;
    }
    
    onConfirm(additionalDays, dailyRate, additionalTotalAmount, { qrAmount: qr, cashAmount: cash });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="font-medium text-blue-900">Extend Room Booking</p>
        <p className="text-sm text-blue-700 mt-1">
          Extend the stay for additional days. Payment will be collected for the extension.
        </p>
      </div>

      {booking.guest && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">Current Booking</h3>
          <p><span className="font-medium">Guest:</span> {booking.guest.name}</p>
          <p><span className="font-medium">Room:</span> {booking.room?.room_number}</p>
          <p><span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}</p>
          <p><span className="font-medium">Current Check-out:</span> {booking.check_out_date ? formatDate(booking.check_out_date) : 'Not set'}</p>
          <p><span className="font-medium">Current Total:</span> {formatCurrency(booking.total_amount)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Additional Days *"
          type="number"
          min={1}
          max={30}
          value={additionalDays.toString()}
          onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
          required
        />
        <Input
          label="Daily Rate (₹) *"
          type="number"
          step="0.01"
          min={0}
          value={dailyRate.toString()}
          onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
          required
        />
      </div>

      {newCheckoutDate && (
        <div className="bg-green-50 border border-green-200 p-3 rounded">
          <p className="text-sm text-green-800">
            <strong>New Check-out Date:</strong> {formatDate(newCheckoutDate)}
          </p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="font-semibold text-gray-900">Extension Charges</h3>
        <div className="flex justify-between">
          <span>Additional Base Amount ({additionalDays} day{additionalDays > 1 ? 's' : ''}):</span>
          <span>{formatCurrency(additionalBaseAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST ({defaultGSTRate}%):</span>
          <span>{formatCurrency(additionalGstAmount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Additional Amount to Pay:</span>
          <span className="text-green-600">{formatCurrency(additionalTotalAmount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2 mt-2">
          <span>New Total Amount:</span>
          <span>{formatCurrency(Number(booking.total_amount) + additionalTotalAmount)}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Method for Extension</h3>
        
        <div className="mb-4">
          <label htmlFor="extensionPaymentMode" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode *
          </label>
          <select
            id="extensionPaymentMode"
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
              <label htmlFor="extensionQrAmount" className="block text-sm font-medium text-gray-700 mb-1">
                QR Payment (₹) *
              </label>
              <input
                id="extensionQrAmount"
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
              <label htmlFor="extensionCashAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Cash Payment (₹) *
              </label>
              <input
                id="extensionCashAmount"
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

        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
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
          {((parseFloat(qrAmount) || 0) + (parseFloat(cashAmount) || 0)) > additionalTotalAmount && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Total payment exceeds extension amount
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading || additionalDays < 1 || dailyRate <= 0 || ((parseFloat(qrAmount) || 0) + (parseFloat(cashAmount) || 0)) <= 0}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Confirm Extension'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

