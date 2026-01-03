import type { RoomStatus } from '../../lib/types';
import { cn } from '../../lib/utils';

interface RoomStatusBadgeProps {
  status: RoomStatus;
}

export function RoomStatusBadge({ status }: RoomStatusBadgeProps) {
  const statusConfig = {
    available: {
      label: 'Available',
      className: 'bg-green-100 text-green-800',
    },
    occupied: {
      label: 'Occupied',
      className: 'bg-red-100 text-red-800',
    },
    cleaning: {
      label: 'Cleaning',
      className: 'bg-yellow-100 text-yellow-800',
    },
    maintenance: {
      label: 'Maintenance',
      className: 'bg-gray-100 text-gray-800',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-semibold rounded-full',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

