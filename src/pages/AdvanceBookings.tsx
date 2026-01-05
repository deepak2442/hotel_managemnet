import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import { formatCurrency, formatDate } from '../lib/utils';
import { getTodayDate } from '../lib/billingUtils';
import { Modal } from '../components/common/Modal';
import { AdvanceBookingForm } from '../components/bookings/AdvanceBookingForm';
import { CancelBookingModal } from '../components/bookings/CancelBookingModal';
import { Button } from '../components/common/Button';
import type { Booking } from '../lib/types';

export function AdvanceBookings() {
  const { reservedBookings, loading, refetch, cancelAdvanceBooking } = useBookings();
  const { rooms } = useRooms();
  const [showForm, setShowForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Use getTodayDate() for consistent date comparison (local time, not UTC)
  const today = getTodayDate();
  // Get all future advance bookings (check-in date is in the future)
  // Only show bookings with status 'reserved' and check-in date > today
  const futureAdvanceBookings = reservedBookings.filter(
    b => b.check_in_date > today && b.status === 'reserved'
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
    setShowEditModal(false);
    setSelectedBooking(null);
    refetch();
    alert(selectedBooking ? 'Advance booking updated successfully!' : 'Advance booking created successfully!');
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowEditModal(false);
    setSelectedBooking(null);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowEditModal(true);
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancellation = async (cancellationCharge: number) => {
    if (!selectedBooking) return;

    setProcessing(true);
    const { error, refundAmount } = await cancelAdvanceBooking(
      selectedBooking.id,
      cancellationCharge
    );

    if (error) {
      alert(`Error: ${error}`);
    } else {
      const message = cancellationCharge === 0
        ? `Booking cancelled successfully! Full refund of ${formatCurrency(refundAmount)} processed.`
        : `Booking cancelled successfully! Refund amount: ${formatCurrency(refundAmount)} (Cancellation charge: ${formatCurrency(cancellationCharge)})`;
      alert(message);
      setShowCancelModal(false);
      setSelectedBooking(null);
      refetch();
    }
    setProcessing(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Future Advance Bookings</h1>
          <p className="text-sm sm:text-base text-gray-600">View and manage all advance bookings scheduled for future dates</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto min-h-[44px]"
        >
          <span className="hidden sm:inline">Add Advance Booking</span>
          <span className="sm:hidden">Add Booking</span>
        </Button>
      </div>

      {futureAdvanceBookings.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No future advance bookings at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Guest
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Check-out
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Guests
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Total
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    QR
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Cash
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {futureAdvanceBookings.map((booking) => {
                const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{booking.room?.room_number}</span>
                        <span className="text-xs text-gray-500 sm:hidden">{booking.guest?.name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {booking.guest?.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.check_in_date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {booking.check_out_date ? formatDate(booking.check_out_date) : 'Not set'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {booking.number_of_guests}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {formatCurrency(Number(booking.total_amount))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-blue-600 hidden lg:table-cell">
                      {formatCurrency(Number(booking.qr_amount || 0))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 hidden lg:table-cell">
                      {formatCurrency(Number(booking.cash_amount || 0))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(Number(booking.amount_paid))}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      {outstanding > 0 ? (
                        <span className="font-semibold text-red-600">{formatCurrency(outstanding)}</span>
                      ) : (
                        <span className="text-green-600">Paid</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEditBooking(booking)}
                          disabled={processing}
                          className="text-xs px-3 py-2 min-h-[44px] w-full sm:w-auto"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={processing}
                          className="text-xs px-3 py-2 min-h-[44px] w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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

      {/* Edit Advance Booking Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCancel}
        title="Edit Advance Booking"
        size="xl"
      >
        {selectedBooking && (
          <AdvanceBookingForm
            rooms={rooms}
            booking={selectedBooking}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        title="Cancel Advance Booking"
        size="md"
      >
        {selectedBooking && (
          <CancelBookingModal
            booking={selectedBooking}
            onConfirm={confirmCancellation}
            onCancel={() => {
              setShowCancelModal(false);
              setSelectedBooking(null);
            }}
            loading={processing}
          />
        )}
      </Modal>
    </div>
  );
}

