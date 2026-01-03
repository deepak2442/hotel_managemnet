import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function Dashboard() {
  const { rooms, loading: roomsLoading } = useRooms();
  const { bookings, loading: bookingsLoading } = useBookings();

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;

  const todayBookings = bookings.filter(
    b => b.check_in_date === format(new Date(), 'yyyy-MM-dd')
  );
  const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.amount_paid), 0);

  const activeBookings = bookings.filter(b => b.status === 'checked_in').length;

  if (roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Room Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Rooms</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalRooms}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Available</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{availableRooms}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Occupied</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{occupiedRooms}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Cleaning</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{cleaningRooms}</p>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-ins Today:</span>
              <span className="font-semibold">{todayBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Today's Revenue:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(todayRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Bookings:</span>
              <span className="font-semibold">{activeBookings}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/check-in"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors"
            >
              Check-In Guest
            </a>
            <a
              href="/check-out"
              className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg text-center hover:bg-red-700 transition-colors"
            >
              Check-Out Guest
            </a>
            <a
              href="/reports"
              className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-center hover:bg-gray-700 transition-colors"
            >
              View Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
