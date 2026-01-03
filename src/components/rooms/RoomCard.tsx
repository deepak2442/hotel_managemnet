import type { Room } from '../../lib/types';
import { RoomStatusBadge } from './RoomStatusBadge';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const getStatusColor = () => {
    switch (room.status) {
      case 'available':
        return 'bg-green-50 border-green-500';
      case 'occupied':
        return 'bg-red-50 border-red-500';
      case 'cleaning':
        return 'bg-yellow-50 border-yellow-500';
      case 'maintenance':
        return 'bg-gray-50 border-gray-500';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const getRoomTypeColor = () => {
    // Room type colors are now secondary to status colors
    // We'll keep a subtle indication but status takes priority
    switch (room.room_type) {
      case 'deluxe':
        return 'ring-blue-200';
      case 'cottage':
        return 'ring-purple-200';
      case 'dormitory':
        return 'ring-gray-200';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={() => onClick(room)}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        hover:shadow-lg hover:scale-105
        ${getStatusColor()}
        ${getRoomTypeColor() ? `ring-2 ${getRoomTypeColor()}` : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-gray-900">Room {room.room_number}</h3>
        <RoomStatusBadge status={room.status} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Floor:</span> {room.floor}
        </p>
        <p>
          <span className="font-medium">Type:</span> {room.room_type}
        </p>
        <p>
          <span className="font-medium">Max Guests:</span> {room.max_occupancy}
        </p>
      </div>
    </div>
  );
}

