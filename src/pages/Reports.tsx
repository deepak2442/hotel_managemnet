import { useState } from 'react';
import { DailyReport } from '../components/reports/DailyReport';
import { MonthlyReport } from '../components/reports/MonthlyReport';
import { YearlyReport } from '../components/reports/YearlyReport';
import { DateRangeReport } from '../components/reports/DateRangeReport';

type ReportType = 'daily' | 'monthly' | 'yearly' | 'daterange';

export function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daterange');

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Reports</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('daterange')}
            className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] text-sm sm:text-base ${
              reportType === 'daterange'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span className="hidden sm:inline">Date Range Report</span>
            <span className="sm:hidden">Date Range</span>
          </button>
          <button
            onClick={() => setReportType('daily')}
            className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] text-sm sm:text-base ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] text-sm sm:text-base ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setReportType('yearly')}
            className={`px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px] text-sm sm:text-base ${
              reportType === 'yearly'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Yearly Report
          </button>
        </div>
      </div>

      <div className="mt-6">
        {reportType === 'daterange' && <DateRangeReport />}
        {reportType === 'daily' && <DailyReport />}
        {reportType === 'monthly' && <MonthlyReport />}
        {reportType === 'yearly' && <YearlyReport />}
      </div>
    </div>
  );
}
