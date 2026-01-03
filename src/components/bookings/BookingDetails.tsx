import type { Booking } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface BookingDetailsProps {
  booking: Booking;
}

export function BookingDetails({ booking }: BookingDetailsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Current Booking</h3>
      {booking.guest && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p><span className="font-medium">Guest Name:</span> {booking.guest.name}</p>
          <p><span className="font-medium">Address:</span> {booking.guest.address}</p>
          <p><span className="font-medium">Proof:</span> {booking.guest.proof_type} - {booking.guest.proof_number}</p>
          {booking.guest.phone && <p><span className="font-medium">Phone:</span> {booking.guest.phone}</p>}
        </div>
      )}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <p><span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}</p>
        <p><span className="font-medium">Number of Guests:</span> {booking.number_of_guests}</p>
        <p><span className="font-medium">Base Amount:</span> {formatCurrency(booking.base_amount)}</p>
        <p><span className="font-medium">GST ({booking.gst_rate}%):</span> {formatCurrency(booking.gst_amount)}</p>
        <p><span className="font-medium">Total Amount:</span> {formatCurrency(booking.total_amount)}</p>
        <p><span className="font-medium">Amount Paid:</span> {formatCurrency(booking.amount_paid)}</p>
      </div>
    </div>
  );
}

