import { useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import { useSettings } from '../hooks/useSettings';
import type { Booking } from '../lib/types';
import { Modal } from '../components/common/Modal';
import { CheckOutModal } from '../components/bookings/CheckOutModal';
import { RoomExtensionModal } from '../components/bookings/RoomExtensionModal';
import { PaymentModal } from '../components/bookings/PaymentModal';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { generateBillPDF } from '../lib/billGenerator';

export function CheckOut() {
  const { activeBookings, bookings, checkOut, markRoomCleaned, extendBooking, updatePayment, refetch } = useBookings();
  const { rooms, refetch: refetchRooms } = useRooms();
  const { getGSTRate } = useSettings();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCheckOut = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCheckOutModal(true);
  };

  const confirmCheckOut = async () => {
    if (!selectedBooking) return;

    setProcessing(true);
    const { error } = await checkOut(selectedBooking.id);

    if (error) {
      alert(`Error: ${error}`);
    } else {
      setShowCheckOutModal(false);
      setSelectedBooking(null);
      refetch();
      refetchRooms();
    }
    setProcessing(false);
  };

  const handleMarkCleaned = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowCleaningModal(true);
  };

  const confirmCleaned = async () => {
    if (!selectedRoomId) return;

    setProcessing(true);
    const { error } = await markRoomCleaned(selectedRoomId);

    if (error) {
      alert(`Error: ${error}`);
    } else {
      setShowCleaningModal(false);
      setSelectedRoomId(null);
      refetch();
      refetchRooms();
    }
    setProcessing(false);
  };

  const handleExtendBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowExtensionModal(true);
  };

  const confirmExtension = async (additionalDays: number, dailyRate: number, additionalAmount: number, paymentData: { qrAmount: number; cashAmount: number }) => {
    if (!selectedBooking) return;

    setProcessing(true);
    const { error } = await extendBooking(
      selectedBooking.id,
      additionalDays,
      dailyRate,
      getGSTRate(),
      paymentData
    );

    if (error) {
      alert(`Error: ${error}`);
    } else {
      alert(`Booking extended successfully! Additional amount: ${formatCurrency(additionalAmount)}`);
      setShowExtensionModal(false);
      setSelectedBooking(null);
      refetch();
      refetchRooms();
    }
    setProcessing(false);
  };

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
      const total = paymentData.qrAmount + paymentData.cashAmount;
      alert(`Payment of ${formatCurrency(total)} added successfully!`);
      setShowPaymentModal(false);
      setSelectedBooking(null);
      refetch();
    }
    setProcessing(false);
  };

  // Get rooms that are in cleaning status
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');

  // Get recently checked-out bookings (last 7 days) for bill generation
  const getRecentCheckedOutBookings = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return bookings.filter(b => {
      if (b.status !== 'checked_out' || !b.check_out_date) return false;
      const checkoutDate = new Date(b.check_out_date);
      return checkoutDate >= sevenDaysAgo;
    }).slice(0, 10); // Limit to 10 most recent
  };

  const recentCheckedOutBookings = getRecentCheckedOutBookings();

  const handleGenerateBill = (booking: Booking) => {
    generateBillPDF(booking);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Check-Out</h1>

      {/* Active Bookings Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Bookings</h2>
        {activeBookings.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No active bookings</p>
          </div>
        ) : (
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
                    Guests
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Total
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
                    <span className="hidden sm:inline">Actions</span>
                    <span className="sm:hidden">Act</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeBookings.map((booking) => (
                  <tr key={booking.id}>
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
                      {booking.number_of_guests}
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
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
                        return outstanding > 0 ? (
                          <span className="font-semibold text-red-600">{formatCurrency(outstanding)}</span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        );
                      })()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm">
                      <div className="flex flex-col sm:flex-row gap-2 min-w-[120px]">
                        {(() => {
                          const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
                          return outstanding > 0 ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleAddPayment(booking)}
                              disabled={processing}
                              className="text-xs px-3 py-2 min-h-[44px] w-full sm:w-auto"
                            >
                              <span className="hidden sm:inline">Add Payment</span>
                              <span className="sm:hidden">Pay</span>
                            </Button>
                          ) : null;
                        })()}
                        <Button
                          variant="primary"
                          onClick={() => handleExtendBooking(booking)}
                          disabled={processing}
                          className="text-xs px-3 py-2 min-h-[44px] w-full sm:w-auto"
                        >
                          Extend
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleCheckOut(booking)}
                          disabled={processing}
                          className="text-xs px-3 py-2 min-h-[44px] w-full sm:w-auto"
                        >
                          <span className="hidden sm:inline">Check-Out</span>
                          <span className="sm:hidden">Out</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Recently Checked-Out Bookings Section */}
      {recentCheckedOutBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Checked-Out (Generate Bill)</h2>
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
                      Check-out
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentCheckedOutBookings.map((booking) => (
                    <tr key={booking.id}>
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
                        {booking.check_out_date ? formatDate(booking.check_out_date) : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(Number(booking.total_amount))}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm">
                        <Button
                          variant="secondary"
                          onClick={() => handleGenerateBill(booking)}
                          className="text-xs px-3 py-2"
                        >
                          Generate Bill
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Requiring Cleaning Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Rooms Requiring Cleaning</h2>
        {cleaningRooms.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No rooms require cleaning</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningRooms.map((room) => (
              <div
                key={room.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Room {room.room_number}</h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Cleaning
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{room.room_type}</p>
                <Button
                  variant="primary"
                  onClick={() => handleMarkCleaned(room.id)}
                  disabled={processing}
                  className="w-full"
                >
                  Mark as Cleaned
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-Out Confirmation Modal */}
      <Modal
        isOpen={showCheckOutModal}
        onClose={() => {
          setShowCheckOutModal(false);
          setSelectedBooking(null);
        }}
        title="Confirm Check-Out"
      >
        {selectedBooking && (
          <CheckOutModal
            booking={selectedBooking}
            onConfirm={confirmCheckOut}
            onCancel={() => {
              setShowCheckOutModal(false);
              setSelectedBooking(null);
            }}
            loading={processing}
          />
        )}
      </Modal>

      {/* Room Extension Modal */}
      <Modal
        isOpen={showExtensionModal}
        onClose={() => {
          setShowExtensionModal(false);
          setSelectedBooking(null);
        }}
        title="Extend Room Booking"
        size="lg"
      >
        {selectedBooking && (
          <RoomExtensionModal
            booking={selectedBooking}
            onConfirm={confirmExtension}
            onCancel={() => {
              setShowExtensionModal(false);
              setSelectedBooking(null);
            }}
            loading={processing}
          />
        )}
      </Modal>

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

      {/* Cleaning Confirmation Modal */}
      <Modal
        isOpen={showCleaningModal}
        onClose={() => {
          setShowCleaningModal(false);
          setSelectedRoomId(null);
        }}
        title="Mark Room as Cleaned"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure this room has been cleaned and is ready for the next guest?
          </p>
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={confirmCleaned}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Yes, Mark as Cleaned'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCleaningModal(false);
                setSelectedRoomId(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
