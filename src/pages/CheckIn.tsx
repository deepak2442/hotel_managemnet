import { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import { RoomGrid } from '../components/rooms/RoomGrid';
import { Modal } from '../components/common/Modal';
import { CheckInForm } from '../components/bookings/CheckInForm';
import type { Room } from '../lib/types';

export function CheckIn() {
  const { rooms, refetch } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    // Optionally redirect or show success message
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedRoom(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In Guest</h1>
        <p className="text-gray-600">Select an available room to check in a guest</p>
      </div>

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
