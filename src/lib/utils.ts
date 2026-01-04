import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateGST(baseAmount: number, gstRate: number): number {
  return (baseAmount * gstRate) / 100;
}

export function calculateTotal(baseAmount: number, gstAmount: number): number {
  return baseAmount + gstAmount;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Opens WhatsApp with a pre-filled welcome message for the guest
 * @param guestPhone - Guest's phone number (without country code)
 * @param guestName - Guest's name
 * @param roomNumber - Room number assigned
 * @param amountPaid - Amount paid by guest
 */
export function openWhatsApp(
  guestPhone: string,
  guestName: string,
  roomNumber: string,
  amountPaid: number
): void {
  // Format guest name with appropriate title
  const guestTitle = guestName.trim();
  
  // Format amount as ₹XXXX/- (Indian format)
  const formattedAmount = `₹${Math.round(amountPaid).toLocaleString('en-IN')}/-`;
  
  const message = ` Welcome to Sridevi Sabhabhavan & Eesha Residency

Dear ${guestTitle},
Namaste 

Sridevi Sabhabhavan & Eesha Residency.
Thank you for choosing to stay with us and for sharing the ID proof and completing the payment of ${formattedAmount}/-.

 Room No: ${roomNumber}
 Wi-Fi Password: eesharesidency (small letters)

Stay Address:
Sridevi Sabhabhavan & Eesha Residency
Google Maps Location

Nearby places to explore (Udupi & around):
• Shri Krishna Matha, Udupi
• Malpe Beach & St. Mary's Island
• Kapu Beach (Lighthouse view after 5:30 PM)
• Mattu & Padubidri Blue Flag Beach
• Varanga Jain Temple & Gomateshwara, Karkala
• Manipal – Cafes & evening walks

 Recommended Restaurants:
Veg: Mitra Samaj, Udupi Woodlands, MTR, Paakashala, Kidiyoor
Non-Veg:  Machali, Thimmappa Fish Hotel, Kediyoor Gazebo

If you need any assistance during your stay, please feel free to contact us anytime:
 +91 70196 22801

We wish you a peaceful and pleasant stay with us 

Warm regards,
 Sridevi Sabhabhavan & Eesha Residency Team`;

  // Remove country code if present, ensure it's just digits
  const cleanPhone = guestPhone.replace(/^\+?91-?/, '').replace(/\D/g, '');
  
  if (!cleanPhone || cleanPhone.length < 10) {
    alert('Invalid phone number. Please provide a valid 10-digit phone number.');
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}

