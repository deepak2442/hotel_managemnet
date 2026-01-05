import { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { formatCurrency, formatDate } from '../lib/utils';
import { format } from 'date-fns';
import { Modal } from '../components/common/Modal';
import { PaymentModal } from '../components/bookings/PaymentModal';
import { Button } from '../components/common/Button';
import type { Booking } from '../lib/types';

export function Dashboard() {
  const { rooms, loading: roomsLoading } = useRooms();
  const { bookings, activeBookings, updatePayment, refetch, loading: bookingsLoading } = useBookings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;

  const todayBookings = bookings.filter(
    b => b.check_in_date === format(new Date(), 'yyyy-MM-dd')
  );
  const todayRevenue = todayBookings.reduce((sum, b) => sum + Number(b.amount_paid), 0);

  // Calculate outstanding balances
  const bookingsWithOutstanding = activeBookings.filter(b => {
    const outstanding = Number(b.total_amount) - Number(b.amount_paid);
    return outstanding > 0;
  });

  const totalOutstanding = bookingsWithOutstanding.reduce((sum, b) => {
    return sum + (Number(b.total_amount) - Number(b.amount_paid));
  }, 0);

  const handleAddPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const confirmPayment = async (paymentData: { qrAmount: number; cashAmount: number }) => {
    if (!selectedBooking) return;

    setProcessing(true);
    const { error } = await updatePayment(selectedBooking.id, paymentData);

    if (error) {
      alert(`Error: ${error}`);
    } else {
      setShowPaymentModal(false);
      setSelectedBooking(null);
      refetch();
    }
    setProcessing(false);
  };

  if (roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h1>
      
      {/* Room Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Rooms</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{totalRooms}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Available</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{availableRooms}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Occupied</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{occupiedRooms}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Cleaning</h3>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-2">{cleaningRooms}</p>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Today's Summary</h3>
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
              <span className="font-semibold">{activeBookings.length}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Outstanding Balance:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/check-in"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors font-medium"
            >
              Check-In Guest
            </a>
            <a
              href="/check-out"
              className="block w-full px-4 py-3 bg-red-600 text-white rounded-lg text-center hover:bg-red-700 transition-colors font-medium"
            >
              Check-Out Guest
            </a>
            <a
              href="/reports"
              className="block w-full px-4 py-3 bg-gray-600 text-white rounded-lg text-center hover:bg-gray-700 transition-colors font-medium"
            >
              View Reports
            </a>
          </div>
        </div>
      </div>

      {/* Outstanding Payments Section */}
      {bookingsWithOutstanding.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Outstanding Payments ({bookingsWithOutstanding.length})
            </h2>
            <div className="text-sm text-gray-600">
              Total Outstanding: <span className="font-semibold text-red-600">{formatCurrency(totalOutstanding)}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Guest
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Check-in
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Total Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    QR
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Cash
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsWithOutstanding.map((booking) => {
                  const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{booking.room?.room_number}</span>
                          <span className="text-xs text-gray-500 sm:hidden">{booking.guest?.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {booking.guest?.name}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {formatCurrency(Number(booking.total_amount))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-blue-600 hidden lg:table-cell">
                        {formatCurrency(Number(booking.qr_amount || 0))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 hidden lg:table-cell">
                        {formatCurrency(Number(booking.cash_amount || 0))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(Number(booking.amount_paid))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        {formatCurrency(outstanding)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="primary"
                          onClick={() => handleAddPayment(booking)}
                          disabled={processing}
                          className="text-xs px-3 py-2 min-h-[44px]"
                        >
                          <span className="hidden sm:inline">Add Payment</span>
                          <span className="sm:hidden">Pay</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBooking(null);
        }}
        title="Add Payment"
        size="md"
      >
        {selectedBooking && (
          <PaymentModal
            booking={selectedBooking}
            onConfirm={confirmPayment}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }}
            loading={processing}
          />
        )}
      </Modal>
    </div>
  );
}
