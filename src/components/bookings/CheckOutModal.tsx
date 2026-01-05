import type { Booking } from '../../lib/types';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { generateBillPDF } from '../../lib/billGenerator';

interface CheckOutModalProps {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CheckOutModal({ booking, onConfirm, onCancel, loading }: CheckOutModalProps) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="font-medium text-yellow-900">Confirm Check-Out</p>
        <p className="text-sm text-yellow-700 mt-1">
          This will mark the room as "Cleaning" and the guest will be checked out.
        </p>
      </div>

      {booking.guest && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900">Guest Information</h3>
          <p><span className="font-medium">Name:</span> {booking.guest.name}</p>
          <p><span className="font-medium">Room:</span> {booking.room?.room_number}</p>
          <p><span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}</p>
          <p><span className="font-medium">Guests:</span> {booking.number_of_guests}</p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="font-semibold text-gray-900">Payment Summary</h3>
        <div className="flex justify-between">
          <span>Base Amount:</span>
          <span>{formatCurrency(booking.base_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST ({booking.gst_rate}%):</span>
          <span>{formatCurrency(booking.gst_amount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Total Amount:</span>
          <span>{formatCurrency(Number(booking.total_amount))}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span className="text-green-600">{formatCurrency(Number(booking.amount_paid))}</span>
        </div>
        {(() => {
          const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
          return outstanding > 0 ? (
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Outstanding Balance:</span>
              <span className="text-red-600">{formatCurrency(outstanding)}</span>
            </div>
          ) : null;
        })()}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={() => generateBillPDF(booking)}
          disabled={loading}
          className="flex-1"
        >
          Generate Bill
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Confirm Check-Out'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

