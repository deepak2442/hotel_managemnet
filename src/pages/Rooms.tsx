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
  const { rooms, loading, createRoom, updateRoom, deleteRoom, refetch } = useRooms();
  const { getActiveBookingByRoom } = useBookings();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [showDeleteSelector, setShowDeleteSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
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

  const handleDeleteRoomClick = () => {
    setShowDeleteSelector(true);
  };

  const handleDeleteRoomSelect = (room: Room) => {
    setDeletingRoom(room);
    setShowDeleteSelector(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoom) return;
    
    const { error } = await deleteRoom(deletingRoom.id);
    if (!error) {
      setShowDeleteConfirm(false);
      setDeletingRoom(null);
      refetch();
    } else {
      alert(`Error deleting room: ${error}`);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingRoom(null);
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
            <Button onClick={handleDeleteRoomClick} variant="danger" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Room
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

      {/* Delete Room Selector Modal */}
      <Modal
        isOpen={showDeleteSelector}
        onClose={() => {
          setShowDeleteSelector(false);
        }}
        title="Select Room to Delete"
        size="lg"
      >
        <RoomSelectorModal
          rooms={rooms}
          onSelect={handleDeleteRoomSelect}
          onCancel={() => {
            setShowDeleteSelector(false);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Confirm Delete Room"
        size="md"
      >
        {deletingRoom && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">Room {deletingRoom.room_number}</span>?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Floor:</span> {deletingRoom.floor}</p>
              <p><span className="font-medium">Type:</span> {deletingRoom.room_type}</p>
              <p><span className="font-medium">Status:</span> {deletingRoom.status}</p>
            </div>
            <p className="text-red-600 text-sm font-medium">
              ⚠️ This action cannot be undone. The room will be permanently deleted.
            </p>
            {deletingRoom && getActiveBookingByRoom(deletingRoom.id) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Warning: This room has an active booking. Deleting it may cause issues.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                Delete Room
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
