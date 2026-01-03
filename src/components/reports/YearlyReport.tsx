import { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { formatCurrency } from '../../lib/utils';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function YearlyReport() {
  const { getYearlyReport, loading } = useReports();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any[] | null>(null);

  const handleGenerate = async () => {
    const data = await getYearlyReport(parseInt(selectedYear));
    setReportData(data);
  };

  const totalRevenue = reportData?.reduce((sum, month) => sum + month.totalRevenue, 0) || 0;
  const totalBookings = reportData?.reduce((sum, month) => sum + month.totalBookings, 0) || 0;
  const avgOccupancy = reportData?.reduce((sum, month) => sum + month.occupancyRate, 0) / (reportData?.length || 1) || 0;

  const revenueChartData = reportData?.map(month => ({
    month: month.month.split(' ')[0],
    revenue: month.totalRevenue,
  })) || [];

  const bookingsChartData = reportData?.map(month => ({
    month: month.month.split(' ')[0],
    bookings: month.totalBookings,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <Input
          label="Select Year"
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          min="2020"
          max={new Date().getFullYear()}
          className="flex-1"
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Average Occupancy</p>
              <p className="text-3xl font-bold text-purple-600">
                {avgOccupancy.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Bookings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Occupancy
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((month, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{month.totalBookings}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatCurrency(month.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {month.occupancyRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

