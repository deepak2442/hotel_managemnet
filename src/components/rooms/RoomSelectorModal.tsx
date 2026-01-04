import type { Room } from '../../lib/types';
import { Button } from '../common/Button';

interface RoomSelectorModalProps {
  rooms: Room[];
  onSelect: (room: Room) => void;
  onCancel: () => void;
}

export function RoomSelectorModal({ rooms, onSelect, onCancel }: RoomSelectorModalProps) {
  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Room to Edit</h3>
        {rooms.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No rooms available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelect(room)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Room {room.room_number}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Type:</span> {room.room_type}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Floor:</span> {room.floor}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Max:</span> {room.max_occupancy}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(room.status)}`}
                  >
                    {room.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

