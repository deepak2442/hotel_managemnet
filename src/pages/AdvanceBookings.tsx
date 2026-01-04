import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import { formatCurrency, formatDate } from '../lib/utils';
import { Modal } from '../components/common/Modal';
import { AdvanceBookingForm } from '../components/bookings/AdvanceBookingForm';
import { Button } from '../components/common/Button';

export function AdvanceBookings() {
  const { reservedBookings, loading, refetch } = useBookings();
  const { rooms } = useRooms();
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  // Get all future advance bookings (check-in date is in the future)
  const futureAdvanceBookings = reservedBookings.filter(
    b => b.check_in_date > today
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading advance bookings...</div>
      </div>
    );
  }

  const handleSuccess = () => {
    setShowForm(false);
    refetch();
    alert('Advance booking created successfully!');
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Future Advance Bookings</h1>
          <p className="text-gray-600">View and manage all advance bookings scheduled for future dates</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Add Advance Booking
        </Button>
      </div>

      {futureAdvanceBookings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No future advance bookings at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advance Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {futureAdvanceBookings.map((booking) => {
                const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.room?.room_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.guest?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.check_in_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.check_out_date ? formatDate(booking.check_out_date) : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.number_of_guests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(Number(booking.total_amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(Number(booking.amount_paid))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {outstanding > 0 ? (
                        <span className="font-semibold text-red-600">{formatCurrency(outstanding)}</span>
                      ) : (
                        <span className="text-green-600">Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Advance Booking Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCancel}
        title="Create Advance Booking"
        size="xl"
      >
        <AdvanceBookingForm
          rooms={rooms}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
}

