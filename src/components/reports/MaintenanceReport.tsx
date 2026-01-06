import { useMaintenanceReport } from '../../hooks/useMaintenanceReport';
import { RoomStatusBadge } from '../rooms/RoomStatusBadge';
import { Button } from '../common/Button';
import { formatDate } from '../../lib/utils';
import { exportMaintenanceReportToExcel, exportMaintenanceReportToPDF } from '../../lib/exportUtils';

export function MaintenanceReport() {
  const { reportData, loading, error } = useMaintenanceReport();

  const handleExportExcel = () => {
    exportMaintenanceReportToExcel(reportData);
  };

  const handleExportPDF = () => {
    exportMaintenanceReportToPDF(reportData);
  };

  const formatTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading maintenance report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading report: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Maintenance Report</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Rooms with Guests</p>
            <p className="text-2xl font-bold text-red-600">{reportData.totalOccupied}</p>
            <p className="text-xs text-red-700 mt-1">Do NOT clean these rooms</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Rooms Needing Cleaning</p>
            <p className="text-2xl font-bold text-yellow-600">{reportData.totalCleaning}</p>
            <p className="text-xs text-yellow-700 mt-1">Clean and replace used items</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Available Rooms</p>
            <p className="text-2xl font-bold text-green-600">{reportData.totalAvailable}</p>
            <p className="text-xs text-green-700 mt-1">Already cleaned</p>
          </div>
        </div>
      </div>

      {/* Rooms with Guests Section */}
      {reportData.occupiedRooms.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="bg-red-50 border-b border-red-200 px-6 py-4">
            <h3 className="text-xl font-semibold text-red-900">
              Rooms with Guests ({reportData.totalOccupied})
            </h3>
            <p className="text-sm text-red-700 mt-1">
              ⚠️ Do NOT clean these rooms - Guests are currently checked in
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.occupiedRooms.map((item) => (
                <div
                  key={item.room.id}
                  className="border-2 border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">
                      Room {item.room.room_number}
                    </h4>
                    <RoomStatusBadge status={item.room.status} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Floor:</span> {item.room.floor}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {item.room.room_type}
                    </p>
                    {item.guest && (
                      <>
                        <p>
                          <span className="font-medium">Guest:</span> {item.guest.name}
                        </p>
                        {item.booking && (
                          <p>
                            <span className="font-medium">Check-in:</span>{' '}
                            {formatDate(item.booking.check_in_date)}
                          </p>
                        )}
                        {item.booking && (
                          <p>
                            <span className="font-medium">Guests:</span>{' '}
                            {item.booking.number_of_guests}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rooms Needing Cleaning Section */}
      {reportData.cleaningRooms.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <h3 className="text-xl font-semibold text-yellow-900">
              Rooms Needing Cleaning ({reportData.totalCleaning})
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              ✅ Clean these rooms and replace used items - Guests have checked out
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.cleaningRooms.map((item) => (
                <div
                  key={item.room.id}
                  className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">
                      Room {item.room.room_number}
                    </h4>
                    <RoomStatusBadge status={item.room.status} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Floor:</span> {item.room.floor}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {item.room.room_type}
                    </p>
                    {item.guest && (
                      <>
                        <p>
                          <span className="font-medium">Guest:</span> {item.guest.name}
                        </p>
                        {item.booking && item.booking.check_out_date && (
                          <p>
                            <span className="font-medium">Check-out:</span>{' '}
                            {formatDate(item.booking.check_out_date)}
                            {item.checkoutTime && ` at ${formatTime(item.checkoutTime)}`}
                          </p>
                        )}
                        {item.booking && (
                          <p>
                            <span className="font-medium">Guests:</span>{' '}
                            {item.booking.number_of_guests}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Rooms Section (Optional - can be collapsed) */}
      {reportData.availableRooms.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <h3 className="text-xl font-semibold text-green-900">
              Available Rooms ({reportData.totalAvailable})
            </h3>
            <p className="text-sm text-green-700 mt-1">
              ✓ These rooms are already cleaned and ready for guests
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.availableRooms.map((item) => (
                <div
                  key={item.room.id}
                  className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">
                      Room {item.room.room_number}
                    </h4>
                    <RoomStatusBadge status={item.room.status} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Floor:</span> {item.room.floor}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {item.room.room_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reportData.totalOccupied === 0 && reportData.totalCleaning === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No rooms require maintenance attention at this time.</p>
        </div>
      )}
    </div>
  );
}


