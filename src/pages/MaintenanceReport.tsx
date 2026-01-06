import { MaintenanceReport } from '../components/reports/MaintenanceReport';

export function MaintenanceReportPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance Report</h1>
        <p className="text-sm text-gray-600 mt-2">
          Generate reports for maintenance staff showing which rooms need cleaning and which have active guests.
        </p>
      </div>
      <MaintenanceReport />
    </div>
  );
}


