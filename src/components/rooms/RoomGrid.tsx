import type { Room } from '../../lib/types';
import { RoomCard } from './RoomCard';

interface RoomGridProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
  loading?: boolean;
}

export function RoomGrid({ rooms, onRoomClick, loading }: RoomGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading rooms...</div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">No rooms found</div>
      </div>
    );
  }

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  const floorLabels: Record<string, string> = {
    ground: 'Ground Floor',
    first: 'First Floor',
    cottage: 'Cottages',
  };

  return (
    <div className="space-y-8">
      {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
        <div key={floor}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {floorLabels[floor] || floor}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {floorRooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={onRoomClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

