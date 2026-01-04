import { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { RoomGrid } from '../components/rooms/RoomGrid';
import { Modal } from '../components/common/Modal';
import { CheckInForm } from '../components/bookings/CheckInForm';
import { Button } from '../components/common/Button';
import type { Room } from '../lib/types';
import type { Booking } from '../lib/types';
import { formatCurrency, formatDate, openWhatsApp } from '../lib/utils';

export function CheckIn() {
  const { rooms, refetch } = useRooms();
  const { reservedBookings, confirmAdvanceBooking, refetch: refetchBookings } = useBookings();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  // Get reserved bookings that are due today or in the past (ready to confirm)
  const readyToConfirmBookings = reservedBookings.filter(
    b => b.check_in_date <= today
  );

  const availableRooms = rooms.filter(r => r.status === 'available');

  const handleRoomClick = (room: Room) => {
    if (room.status === 'available') {
      setSelectedRoom(room);
      setShowForm(true);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedRoom(null);
    refetch();
    refetchBookings(); // Refresh bookings to show new advance booking
    // Success message will be shown by the form or we can add it here if needed
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedRoom(null);
  };

  const handleConfirmAdvanceBooking = async (booking: Booking) => {
    setProcessing(true);
    const { error } = await confirmAdvanceBooking(booking.id);
    
    if (error) {
      alert(`Error: ${error}`);
    } else {
      alert('Advance booking confirmed! Guest is now checked in.');
      refetch();
      refetchBookings();
      
      // Open WhatsApp if phone number is available
      if (booking.guest?.phone && booking.room) {
        setTimeout(() => {
          openWhatsApp(
            booking.guest!.phone!,
            booking.guest!.name,
            booking.room!.room_number,
            booking.amount_paid
          );
        }, 500);
      }
    }
    setProcessing(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In Guest</h1>
        <p className="text-gray-600">Select an available room to check in a guest or confirm advance bookings</p>
      </div>

      {/* Advance Bookings Ready to Confirm */}
      {readyToConfirmBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Advance Bookings Ready to Confirm</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
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
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readyToConfirmBookings.map((booking) => (
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
                      {formatCurrency(booking.amount_paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={() => handleConfirmAdvanceBooking(booking)}
                          disabled={processing}
                          className="text-xs"
                        >
                          Confirm Check-In
                        </Button>
                        {booking.guest?.phone && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (booking.guest?.phone && booking.room) {
                                openWhatsApp(
                                  booking.guest.phone,
                                  booking.guest.name,
                                  booking.room.room_number,
                                  booking.amount_paid
                                );
                              }
                            }}
                            className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                            title="Send WhatsApp Welcome Message"
                          >
                            📱 WhatsApp
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {availableRooms.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">No available rooms at the moment.</p>
        </div>
      ) : (
        <RoomGrid
          rooms={availableRooms}
          onRoomClick={handleRoomClick}
          loading={false}
        />
      )}

      <Modal
        isOpen={showForm}
        onClose={handleCancel}
        title={selectedRoom ? `Check-In - Room ${selectedRoom.room_number}` : 'Check-In'}
        size="xl"
      >
        {selectedRoom && (
          <CheckInForm
            room={selectedRoom}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </Modal>
    </div>
  );
}
