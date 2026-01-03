import { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format } from 'date-fns';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { exportToExcel, printReport } from '../../lib/exportUtils';
import type { Booking } from '../../lib/types';

export function DateRangeReport() {
  const { getDateRangeReport, loading } = useReports();
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    const data = await getDateRangeReport(new Date(startDate), new Date(endDate));
    setReportData(data);
  };

  const handleExportExcel = () => {
    if (!reportData || !reportData.bookings) return;
    
    exportToExcel(
      reportData.bookings as Booking[],
      'hotel-date-range-report',
      {
        totalBookings: reportData.totalBookings,
        totalRevenue: reportData.totalRevenue,
        occupancyRate: reportData.occupancyRate,
        dateRange: reportData.dateRange,
      }
    );
  };

  const handlePrint = () => {
    if (!reportData) return;
    printReport('printable-report', `Hotel Report - ${reportData.dateRange}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {reportData && (
        <div id="printable-report" className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6 no-print">
            <h3 className="text-xl font-semibold text-gray-900">
              Date Range Report - {reportData.dateRange}
            </h3>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.totalBookings}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.totalRevenue)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {reportData.occupancyRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {reportData.bookings && reportData.bookings.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Bookings Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.bookings.map((booking: any) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {booking.room?.room_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {booking.guest?.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(booking.check_in_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {booking.check_out_date ? formatDate(booking.check_out_date) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {booking.number_of_guests}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatCurrency(booking.amount_paid)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'checked_in' 
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'checked_out'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

