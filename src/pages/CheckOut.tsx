import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import type { Booking } from '../lib/types';
import { Modal } from '../components/common/Modal';
import { CheckOutModal } from '../components/bookings/CheckOutModal';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDate } from '../lib/utils';

export function CheckOut() {
  const { activeBookings, checkOut, markRoomCleaned, refetch } = useBookings();
  const { rooms, refetch: refetchRooms } = useRooms();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCheckOut = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCheckOutModal(true);
  };

  const confirmCheckOut = async () => {
    if (!selectedBooking) return;

    setProcessing(true);
    const { error } = await checkOut(selectedBooking.id);

    if (error) {
      alert(`Error: ${error}`);
    } else {
      setShowCheckOutModal(false);
      setSelectedBooking(null);
      refetch();
      refetchRooms();
    }
    setProcessing(false);
  };

  const handleMarkCleaned = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowCleaningModal(true);
  };

  const confirmCleaned = async () => {
    if (!selectedRoomId) return;

    setProcessing(true);
    const { error } = await markRoomCleaned(selectedRoomId);

    if (error) {
      alert(`Error: ${error}`);
    } else {
      setShowCleaningModal(false);
      setSelectedRoomId(null);
      refetch();
      refetchRooms();
    }
    setProcessing(false);
  };

  // Get rooms that are in cleaning status
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Check-Out</h1>

      {/* Active Bookings Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Bookings</h2>
        {activeBookings.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No active bookings</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeBookings.map((booking) => (
                  <tr key={booking.id}>
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
                      {booking.number_of_guests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(booking.amount_paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="danger"
                        onClick={() => handleCheckOut(booking)}
                        disabled={processing}
                      >
                        Check-Out
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rooms Requiring Cleaning Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Rooms Requiring Cleaning</h2>
        {cleaningRooms.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No rooms require cleaning</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningRooms.map((room) => (
              <div
                key={room.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Room {room.room_number}</h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Cleaning
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{room.room_type}</p>
                <Button
                  variant="primary"
                  onClick={() => handleMarkCleaned(room.id)}
                  disabled={processing}
                  className="w-full"
                >
                  Mark as Cleaned
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-Out Confirmation Modal */}
      <Modal
        isOpen={showCheckOutModal}
        onClose={() => {
          setShowCheckOutModal(false);
          setSelectedBooking(null);
        }}
        title="Confirm Check-Out"
      >
        {selectedBooking && (
          <CheckOutModal
            booking={selectedBooking}
            onConfirm={confirmCheckOut}
            onCancel={() => {
              setShowCheckOutModal(false);
              setSelectedBooking(null);
            }}
            loading={processing}
          />
        )}
      </Modal>

      {/* Cleaning Confirmation Modal */}
      <Modal
        isOpen={showCleaningModal}
        onClose={() => {
          setShowCleaningModal(false);
          setSelectedRoomId(null);
        }}
        title="Mark Room as Cleaned"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure this room has been cleaned and is ready for the next guest?
          </p>
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={confirmCleaned}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Yes, Mark as Cleaned'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCleaningModal(false);
                setSelectedRoomId(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
