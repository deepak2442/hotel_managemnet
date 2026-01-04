import { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import { RoomGrid } from '../components/rooms/RoomGrid';
import type { Room } from '../lib/types';
import { Modal } from '../components/common/Modal';
import { BookingDetails } from '../components/bookings/BookingDetails';
import { useBookings } from '../hooks/useBookings';
import { RoomForm } from '../components/rooms/RoomForm';
import { RoomSelectorModal } from '../components/rooms/RoomSelectorModal';
import { Button } from '../components/common/Button';

export function Rooms() {
  const { rooms, loading, createRoom, updateRoom, refetch } = useRooms();
  const { getActiveBookingByRoom } = useBookings();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setShowDetails(true);
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowRoomForm(true);
  };

  const handleEditRoomClick = () => {
    setShowRoomSelector(true);
  };

  const handleRoomSelect = (room: Room) => {
    setEditingRoom(room);
    setShowRoomSelector(false);
    setShowRoomForm(true);
  };

  const handleRoomFormSubmit = async (data: {
    room_number: string;
    floor: Room['floor'];
    room_type: Room['room_type'];
    max_occupancy: number;
    status: Room['status'];
  }) => {
    if (editingRoom) {
      const { error } = await updateRoom(editingRoom.id, data);
      if (!error) {
        setShowRoomForm(false);
        setEditingRoom(null);
        refetch();
      }
      return { error };
    } else {
      const { error } = await createRoom(data);
      if (!error) {
        setShowRoomForm(false);
        refetch();
      }
      return { error };
    }
  };

  const activeBooking = selectedRoom ? getActiveBookingByRoom(selectedRoom.id) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Total: {rooms.length} | Available: {rooms.filter(r => r.status === 'available').length} | 
            Occupied: {rooms.filter(r => r.status === 'occupied').length} | 
            Cleaning: {rooms.filter(r => r.status === 'cleaning').length}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEditRoomClick} variant="outline" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Room
            </Button>
            <Button onClick={handleAddRoom}>Add Room</Button>
          </div>
        </div>
      </div>

      <RoomGrid rooms={rooms} onRoomClick={handleRoomClick} loading={loading} />

      {/* Room Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedRoom(null);
        }}
        title={selectedRoom ? `Room ${selectedRoom.room_number} Details` : ''}
        size="lg"
      >
        {selectedRoom && (
          <div>
            <div className="mb-4 space-y-2">
              <p><span className="font-medium">Room Number:</span> {selectedRoom.room_number}</p>
              <p><span className="font-medium">Floor:</span> {selectedRoom.floor}</p>
              <p><span className="font-medium">Type:</span> {selectedRoom.room_type}</p>
              <p><span className="font-medium">Max Occupancy:</span> {selectedRoom.max_occupancy}</p>
              <p><span className="font-medium">Status:</span> {selectedRoom.status}</p>
            </div>
            {activeBooking && (
              <div className="mt-4">
                <BookingDetails booking={activeBooking} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Room Selector Modal */}
      <Modal
        isOpen={showRoomSelector}
        onClose={() => {
          setShowRoomSelector(false);
        }}
        title="Select Room to Edit"
        size="lg"
      >
        <RoomSelectorModal
          rooms={rooms}
          onSelect={handleRoomSelect}
          onCancel={() => {
            setShowRoomSelector(false);
          }}
        />
      </Modal>

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={showRoomForm}
        onClose={() => {
          setShowRoomForm(false);
          setEditingRoom(null);
        }}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
        size="lg"
      >
        <RoomForm
          room={editingRoom}
          onSubmit={handleRoomFormSubmit}
          onCancel={() => {
            setShowRoomForm(false);
            setEditingRoom(null);
          }}
        />
      </Modal>
    </div>
  );
}
