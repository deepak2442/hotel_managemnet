import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    'Cancellation Charge': booking.cancellation_charge || 0,
    'Refund Amount': booking.refund_amount || 0,
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

/**
 * Format date as DD/MM/YYYY
 */
function formatDateDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM from ISO timestamp
 */
function formatTimeHHMM(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate number of days between check-in and check-out
 */
function calculateDays(checkInDate: string, checkOutDate: string | null): number {
  if (!checkOutDate) return 0;
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Export bookings to Excel in detailed guest register format
 * Columns: SL No, Name, Mobile Number, Aadhar/DL Number, Room Number, 
 * Number of Persons, Check in Date, Time (hrs), Check out Date, Time (hrs),
 * Number of days, Advance Payment (Rs), QR, Cash, Extended, Refund, Total
 * Includes summary row with overall totals
 */
export function exportToExcelDetailed(
  bookings: Booking[],
  filename: string = 'guest-register',
  monthYear?: string,
  hotelName: string = 'Eesha Residency'
) {
  // Prepare data rows
  const dataRows: any[][] = [];
  
  // Row 1: Hotel Name (merged across columns A-Q, which is 0-16)
  dataRows.push([hotelName]);
  
  // Row 2: Month (merged across columns A-Q)
  const monthText = monthYear || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  dataRows.push([`Month: ${monthText}`]);
  
  // Row 3: Column Headers (17 columns: A-Q)
  dataRows.push([
    'SL No',
    'Name',
    'Mobile Number',
    'Aadhar/DL Number',
    'Room Number',
    'Number of Persons',
    'Check in Date',
    'Time (hrs)',
    'Check out Date',
    'Time (hrs)',
    'Number of days',
    'Advance Payment (Rs)',
    'QR',
    'Cash',
    'Extended',
    'Refund',
    'Total'
  ]);
  
  // Track totals for summary row
  let totalAdvancePayment = 0;
  let totalQR = 0;
  let totalCash = 0;
  let totalExtended = 0;
  let totalRefund = 0;
  let grandTotal = 0;
  
  // Data rows
  bookings.forEach((booking, index) => {
    const guestName = booking.guest?.name || 'N/A';
    const address = booking.guest?.address || '';
    // Format name with location (e.g., "Mandar, Solapur")
    const nameWithLocation = address ? `${guestName}, ${address}` : guestName;
    
    const qrAmount = Number(booking.qr_amount || 0);
    const cashAmount = Number(booking.cash_amount || 0);
    const extendedAmount = Number(booking.extended_amount || 0);
    const refundAmount = Number(booking.refund_amount || 0);
    const totalPaid = Number(booking.amount_paid || 0);
    
    // Calculate advance payment (initial payment at check-in)
    // Advance payment is the initial payment made, before any extensions
    // If there's an extended amount, the advance is total - extended
    // Otherwise, advance payment equals the total paid
    const advancePayment = extendedAmount > 0 
      ? Math.max(0, totalPaid - extendedAmount) 
      : totalPaid;
    
    // Total = Advance Payment + QR + Cash + Extended - Refund
    const totalPayment = advancePayment + qrAmount + cashAmount + extendedAmount - refundAmount;
    
    // Accumulate totals
    totalAdvancePayment += advancePayment;
    totalQR += qrAmount;
    totalCash += cashAmount;
    totalExtended += extendedAmount;
    totalRefund += refundAmount;
    grandTotal += totalPayment;
    
    // Format check-in time
    let checkInTime = '';
    if (booking.actual_check_in_time) {
      checkInTime = formatTimeHHMM(booking.actual_check_in_time);
    }
    
    // Format check-out time
    let checkOutTime = '';
    if (booking.actual_check_out_time) {
      checkOutTime = formatTimeHHMM(booking.actual_check_out_time);
    }
    
    // Calculate number of days
    let numberOfDays = '';
    if (booking.check_out_date) {
      const days = calculateDays(booking.check_in_date, booking.check_out_date);
      numberOfDays = days > 0 ? String(days) : '';
    }
    
    dataRows.push([
      index + 1, // SL No
      nameWithLocation, // Name with location
      booking.guest?.phone || '', // Mobile Number
      booking.guest?.proof_number || '', // Aadhar/DL Number
      booking.room?.room_number || 'N/A', // Room Number
      booking.number_of_guests, // Number of Persons
      formatDateDDMMYYYY(booking.check_in_date), // Check in Date
      checkInTime, // Time (hrs) - Check-in
      booking.check_out_date ? formatDateDDMMYYYY(booking.check_out_date) : '', // Check out Date
      checkOutTime, // Time (hrs) - Check-out
      numberOfDays, // Number of days
      advancePayment > 0 ? advancePayment : '', // Advance Payment (Rs)
      qrAmount > 0 ? qrAmount : '', // QR
      cashAmount > 0 ? cashAmount : '', // Cash
      extendedAmount > 0 ? extendedAmount : '', // Extended
      refundAmount > 0 ? refundAmount : '', // Refund
      totalPayment // Total
    ]);
  });
  
  // Add summary row with totals
  dataRows.push([
    'TOTAL', // SL No
    '', // Name
    '', // Mobile Number
    '', // Aadhar/DL Number
    '', // Room Number
    '', // Number of Persons
    '', // Check in Date
    '', // Time (hrs)
    '', // Check out Date
    '', // Time (hrs)
    '', // Number of days
    totalAdvancePayment, // Advance Payment (Rs)
    totalQR, // QR
    totalCash, // Cash
    totalExtended, // Extended
    totalRefund, // Refund
    grandTotal // Total
  ]);
  
  // Create worksheet from array of arrays
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  
  // Merge cells for header rows (A-Q = columns 0-16)
  const mergeRanges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // Row 1: Hotel Name (A-Q)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // Row 2: Month (A-Q)
  ];
  ws['!merges'] = mergeRanges;
  
  // Set column widths (17 columns: A-Q)
  const colWidths = [
    { wch: 8 },  // A: SL No
    { wch: 25 }, // B: Name
    { wch: 15 }, // C: Mobile Number
    { wch: 18 }, // D: Aadhar/DL Number
    { wch: 12 }, // E: Room Number
    { wch: 15 }, // F: Number of Persons
    { wch: 15 }, // G: Check in Date
    { wch: 12 }, // H: Time (hrs) - Check-in
    { wch: 15 }, // I: Check out Date
    { wch: 12 }, // J: Time (hrs) - Check-out
    { wch: 15 }, // K: Number of days
    { wch: 18 }, // L: Advance Payment (Rs)
    { wch: 12 }, // M: QR
    { wch: 12 }, // N: Cash
    { wch: 12 }, // O: Extended
    { wch: 12 }, // P: Refund
    { wch: 12 }, // Q: Total
  ];
  ws['!cols'] = colWidths;
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guest Register');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}-${timestamp}.xlsx`;
  
  // Write file
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Export maintenance report to Excel
 */
export function exportMaintenanceReportToExcel(reportData: {
  occupiedRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
    guest?: { name: string } | null;
    booking?: { check_in_date: string; number_of_guests: number } | null;
  }>;
  cleaningRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
    guest?: { name: string } | null;
    booking?: { check_out_date: string | null; number_of_guests: number; actual_check_out_time?: string | null } | null;
    checkoutTime?: string | null;
  }>;
  availableRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
  }>;
  totalOccupied: number;
  totalCleaning: number;
  totalAvailable: number;
}) {
  const wb = XLSX.utils.book_new();

  // Format time helper
  const formatTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Sheet 1: Rooms with Guests (Do NOT clean)
  const occupiedData = reportData.occupiedRooms.map((item) => ({
    'Room Number': item.room.room_number,
    'Floor': item.room.floor,
    'Room Type': item.room.room_type,
    'Status': item.room.status,
    'Guest Name': item.guest?.name || 'N/A',
    'Check-in Date': item.booking ? formatDate(item.booking.check_in_date) : 'N/A',
    'Number of Guests': item.booking?.number_of_guests || 'N/A',
    'Action': 'Do NOT clean - Guest checked in',
  }));

  if (occupiedData.length > 0) {
    const occupiedWs = XLSX.utils.json_to_sheet(occupiedData);
    occupiedWs['!cols'] = [
      { wch: 12 }, // Room Number
      { wch: 12 }, // Floor
      { wch: 12 }, // Room Type
      { wch: 12 }, // Status
      { wch: 25 }, // Guest Name
      { wch: 15 }, // Check-in Date
      { wch: 15 }, // Number of Guests
      { wch: 30 }, // Action
    ];
    XLSX.utils.book_append_sheet(wb, occupiedWs, 'Rooms with Guests');
  }

  // Sheet 2: Rooms Needing Cleaning
  const cleaningData = reportData.cleaningRooms.map((item) => ({
    'Room Number': item.room.room_number,
    'Floor': item.room.floor,
    'Room Type': item.room.room_type,
    'Status': item.room.status,
    'Guest Name': item.guest?.name || 'N/A',
    'Check-out Date': item.booking?.check_out_date ? formatDate(item.booking.check_out_date) : 'N/A',
    'Check-out Time': item.checkoutTime ? formatTime(item.checkoutTime) : 'N/A',
    'Number of Guests': item.booking?.number_of_guests || 'N/A',
    'Action': 'Clean and replace used items',
  }));

  if (cleaningData.length > 0) {
    const cleaningWs = XLSX.utils.json_to_sheet(cleaningData);
    cleaningWs['!cols'] = [
      { wch: 12 }, // Room Number
      { wch: 12 }, // Floor
      { wch: 12 }, // Room Type
      { wch: 12 }, // Status
      { wch: 25 }, // Guest Name
      { wch: 15 }, // Check-out Date
      { wch: 12 }, // Check-out Time
      { wch: 15 }, // Number of Guests
      { wch: 30 }, // Action
    ];
    XLSX.utils.book_append_sheet(wb, cleaningWs, 'Rooms Needing Cleaning');
  }

  // Sheet 3: Summary
  const summaryData = [
    ['Maintenance Report Summary'],
    ['Generated on', new Date().toLocaleString()],
    [''],
    ['Category', 'Count'],
    ['Rooms with Guests (Do NOT clean)', reportData.totalOccupied],
    ['Rooms Needing Cleaning', reportData.totalCleaning],
    ['Available Rooms (Already cleaned)', reportData.totalAvailable],
    ['Total Rooms', reportData.totalOccupied + reportData.totalCleaning + reportData.totalAvailable],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 35 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `maintenance-report-${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Export maintenance report to PDF
 */
export function exportMaintenanceReportToPDF(reportData: {
  occupiedRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
    guest?: { name: string } | null;
    booking?: { check_in_date: string; number_of_guests: number } | null;
  }>;
  cleaningRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
    guest?: { name: string } | null;
    booking?: { check_out_date: string | null; number_of_guests: number; actual_check_out_time?: string | null } | null;
    checkoutTime?: string | null;
  }>;
  availableRooms: Array<{
    room: { room_number: string; floor: string; room_type: string; status: string };
  }>;
  totalOccupied: number;
  totalCleaning: number;
  totalAvailable: number;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = margin;

  // Format time helper
  const formatTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Maintenance Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryData = [
    ['Rooms with Guests (Do NOT clean)', reportData.totalOccupied.toString()],
    ['Rooms Needing Cleaning', reportData.totalCleaning.toString()],
    ['Available Rooms (Already cleaned)', reportData.totalAvailable.toString()],
    ['Total Rooms', (reportData.totalOccupied + reportData.totalCleaning + reportData.totalAvailable).toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Count']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Rooms with Guests Section
  if (reportData.occupiedRooms.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69); // Red color
    doc.text(`Rooms with Guests (${reportData.totalOccupied}) - Do NOT clean`, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const occupiedTableData = reportData.occupiedRooms.map((item) => [
      item.room.room_number,
      item.room.floor,
      item.room.room_type,
      item.guest?.name || 'N/A',
      item.booking ? formatDate(item.booking.check_in_date) : 'N/A',
      item.booking?.number_of_guests?.toString() || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Room', 'Floor', 'Type', 'Guest Name', 'Check-in Date', 'Guests']],
      body: occupiedTableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Rooms Needing Cleaning Section
  if (reportData.cleaningRooms.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 193, 7); // Yellow color
    doc.text(`Rooms Needing Cleaning (${reportData.totalCleaning}) - Clean and replace items`, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const cleaningTableData = reportData.cleaningRooms.map((item) => [
      item.room.room_number,
      item.room.floor,
      item.room.room_type,
      item.guest?.name || 'N/A',
      item.booking?.check_out_date ? formatDate(item.booking.check_out_date) : 'N/A',
      item.checkoutTime ? formatTime(item.checkoutTime) : 'N/A',
      item.booking?.number_of_guests?.toString() || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Room', 'Floor', 'Type', 'Guest Name', 'Check-out Date', 'Check-out Time', 'Guests']],
      body: cleaningTableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7] },
      margin: { left: margin, right: margin },
    });
  }

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`maintenance-report-${timestamp}.pdf`);
}

