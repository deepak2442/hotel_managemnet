import * as XLSX from 'xlsx';
import type { Booking } from './types';
import { formatDate } from './utils';

/**
 * Export bookings data to Excel file
 */
export function exportToExcel(
  bookings: Booking[],
  filename: string = 'hotel-report',
  summary?: {
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    dateRange?: string;
  }
) {
  // Prepare data for Excel
  const bookingData = bookings.map((booking) => ({
    'Room Number': booking.room?.room_number || 'N/A',
    'Guest Name': booking.guest?.name || 'N/A',
    'Check-In Date': formatDate(booking.check_in_date),
    'Check-Out Date': booking.check_out_date ? formatDate(booking.check_out_date) : 'N/A',
    'Number of Guests': booking.number_of_guests,
    'Base Amount': booking.base_amount,
    'GST Rate (%)': booking.gst_rate,
    'GST Amount': booking.gst_amount,
    'Total Amount': booking.total_amount,
    'Amount Paid': booking.amount_paid,
    'Payment Method': booking.payment_method,
    'Status': booking.status,
    'Phone': booking.guest?.phone || 'N/A',
    'Email': booking.guest?.email || 'N/A',
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add summary sheet if provided
  if (summary) {
    const summaryData = [
      ['Hotel Report Summary'],
      [''],
      ['Date Range', summary.dateRange || 'N/A'],
      ['Total Bookings', summary.totalBookings],
      ['Total Revenue', summary.totalRevenue],
      ['Occupancy Rate (%)', summary.occupancyRate.toFixed(2)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  }

  // Add bookings sheet
  const ws = XLSX.utils.json_to_sheet(bookingData);
  
  // Set column widths
  const colWidths = [
    { wch: 12 }, // Room Number
    { wch: 20 }, // Guest Name
    { wch: 15 }, // Check-In Date
    { wch: 15 }, // Check-Out Date
    { wch: 15 }, // Number of Guests
    { wch: 12 }, // Base Amount
    { wch: 12 }, // GST Rate
    { wch: 12 }, // GST Amount
    { wch: 12 }, // Total Amount
    { wch: 12 }, // Amount Paid
    { wch: 15 }, // Payment Method
    { wch: 12 }, // Status
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}-${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Print report - creates a print-friendly version
 */
export function printReport(elementId: string, title: string = 'Hotel Report') {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    console.error('Print element not found');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the report');
    return;
  }

  // Get the content
  const content = printContent.innerHTML;

  // Create print-friendly HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .summary-card {
              border: 1px solid #ddd;
              padding: 10px;
              margin: 10px 0;
              display: inline-block;
              min-width: 150px;
            }
            h1, h2, h3 {
              margin: 10px 0;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .summary-card {
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
            display: inline-block;
            min-width: 150px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${content}
      </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

