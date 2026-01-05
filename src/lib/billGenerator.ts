import jsPDF from 'jspdf';
import type { Booking } from './types';
import { calculateNights } from './billingUtils';
import { formatDate } from './utils';

const COMPANY_NAME = 'Sridevi Sabhabhavan & Eesha Residency';
const COMPANY_ADDRESS = 'Kinnimulki, Udupi, Karnataka 576101';

/**
 * Formats amount for PDF display (without currency symbol to avoid rendering issues)
 * @param amount - The amount to format
 * @returns Formatted string like "Rs. 2,200.00"
 */
function formatAmountForPDF(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Generates a PDF bill/invoice for a booking
 * @param booking - The booking object with all necessary details
 */
export function generateBillPDF(booking: Booking): void {
  const doc = new jsPDF();
  
  // Set up fonts and colors
  const primaryColor: [number, number, number] = [0, 51, 102]; // Dark blue
  const secondaryColor: [number, number, number] = [100, 100, 100]; // Gray
  
  // Header Section
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_ADDRESS, 105, 28, { align: 'center' });
  
  // Bill/Invoice Title
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL / INVOICE', 105, 40, { align: 'center' });
  
  // Bill Details Section
  let yPos = 50;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Bill Date
  const billDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Date: ${billDate}`, 20, yPos);
  
  // Bill Number (using booking ID first 8 characters)
  const billNumber = booking.id.substring(0, 8).toUpperCase();
  doc.text(`Bill No: ${billNumber}`, 150, yPos);
  
  yPos += 15;
  
  // Guest/Company Information
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  
  // If GSTIN is provided, use company name format, otherwise use guest name
  if (booking.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(booking.guest?.name || 'Guest', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
    doc.text(`GSTIN: ${booking.gstin}`, 20, yPos);
  } else {
    doc.text(booking.guest?.name || 'Guest', 20, yPos);
  }
  
  yPos += 10;
  
  // Booking Details
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Details:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  
  // Room Number
  doc.text(`Room No: ${booking.room?.room_number || 'N/A'}`, 20, yPos);
  yPos += 7;
  
  // Check-in Date
  const checkInDate = formatDate(booking.check_in_date);
  doc.text(`Check-in: ${checkInDate}`, 20, yPos);
  yPos += 7;
  
  // Check-out Date
  if (booking.check_out_date) {
    const checkOutDate = formatDate(booking.check_out_date);
    doc.text(`Check-out: ${checkOutDate}`, 20, yPos);
    yPos += 7;
    
    // Calculate nights stayed
    const nights = calculateNights(
      booking.check_in_date,
      booking.check_out_date,
      booking.actual_check_out_time || undefined
    );
    doc.text(`Nights Stayed: ${nights}`, 20, yPos);
  } else {
    doc.text('Check-out: Not checked out', 20, yPos);
  }
  
  yPos += 15;
  
  // Amount Details Section
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Details:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 10;
  
  // Base Amount
  doc.text('Base Amount:', 20, yPos);
  doc.text(formatAmountForPDF(Number(booking.base_amount)), 150, yPos, { align: 'right' });
  yPos += 7;
  
  // GST (if applicable)
  if (booking.gst_amount > 0) {
    doc.text(`GST (${booking.gst_rate}%):`, 20, yPos);
    doc.text(formatAmountForPDF(Number(booking.gst_amount)), 150, yPos, { align: 'right' });
    yPos += 7;
  }
  
  // Extended Amount (if any)
  if (booking.extended_amount > 0) {
    doc.text('Extended Stay:', 20, yPos);
    doc.text(formatAmountForPDF(Number(booking.extended_amount)), 150, yPos, { align: 'right' });
    yPos += 7;
  }
  
  // Separator line
  yPos += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  yPos += 7;
  
  // Total Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', 20, yPos);
  doc.text(formatAmountForPDF(Number(booking.total_amount)), 150, yPos, { align: 'right' });
  
  // Payment Details (if needed)
  yPos += 15;
  if (booking.amount_paid > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Details:', 20, yPos);
    yPos += 7;
    
    if (booking.qr_amount > 0) {
      doc.text(`QR Payment: ${formatAmountForPDF(Number(booking.qr_amount))}`, 20, yPos);
      yPos += 7;
    }
    
    if (booking.cash_amount > 0) {
      doc.text(`Cash Payment: ${formatAmountForPDF(Number(booking.cash_amount))}`, 20, yPos);
      yPos += 7;
    }
    
    doc.text(`Total Paid: ${formatAmountForPDF(Number(booking.amount_paid))}`, 20, yPos);
    yPos += 7;
    
    const outstanding = Number(booking.total_amount) - Number(booking.amount_paid);
    if (outstanding > 0) {
      doc.setTextColor(255, 0, 0);
      doc.text(`Outstanding: ${formatAmountForPDF(outstanding)}`, 20, yPos);
      doc.setTextColor(0, 0, 0);
    }
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your stay!', 105, pageHeight - 15, { align: 'center' });
  doc.text('For any queries, please contact us.', 105, pageHeight - 10, { align: 'center' });
  
  // Generate filename
  const guestName = booking.guest?.name || 'Guest';
  const sanitizedName = guestName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `bill_${sanitizedName}_${billNumber}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}

