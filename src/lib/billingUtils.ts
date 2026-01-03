/**
 * Billing utilities for 24-hour check-in/checkout system
 * All billing is normalized to 12:00 PM (noon) regardless of actual arrival time
 */

/**
 * Normalizes a check-in date/time to always be at 12:00 PM (noon) for billing purposes
 * @param actualTime - The actual arrival time (optional, defaults to now)
 * @returns Date string in YYYY-MM-DD format (billing date)
 */
export function normalizeCheckInDate(actualTime?: Date | string): string {
  const now = actualTime ? new Date(actualTime) : new Date();
  // Always use the date part, billing starts at 12:00 PM of that date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the default checkout date (next day at 12:00 PM)
 * @param checkInDate - The check-in date (YYYY-MM-DD format)
 * @returns Date string in YYYY-MM-DD format (checkout date)
 */
export function calculateDefaultCheckoutDate(checkInDate: string): string {
  const date = new Date(checkInDate);
  date.setDate(date.getDate() + 1); // Add 1 day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the number of nights/days for billing based on check-in and checkout dates
 * Uses 12:00 PM as the cutoff time
 * @param checkInDate - Check-in date (YYYY-MM-DD)
 * @param checkOutDate - Check-out date (YYYY-MM-DD)
 * @param actualCheckOutTime - Optional actual checkout time to determine if past 12:00 PM
 * @returns Number of nights (1 = same day checkout before 12 PM, 2+ = multiple nights)
 */
export function calculateNights(
  checkInDate: string,
  checkOutDate: string,
  actualCheckOutTime?: Date | string
): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  // Calculate days difference
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If checkout is on the same day or next day before 12 PM, it's 1 night
  // If checkout is after 12 PM on the next day, it's 2 nights
  if (diffDays === 1 && actualCheckOutTime) {
    const checkoutTime = new Date(actualCheckOutTime);
    const checkoutHour = checkoutTime.getHours();
    // If checking out after 12:00 PM (noon), charge for 2 days
    if (checkoutHour >= 12) {
      return 2;
    }
  }
  
  // Default: 1 night for same day or next day checkout
  // More than 1 day difference = multiple nights
  return Math.max(1, diffDays);
}

/**
 * Formats a date to include time at 12:00 PM for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted string showing date at 12:00 PM
 */
export function formatBillingDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ' at 12:00 PM';
}

/**
 * Gets the current date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return normalizeCheckInDate();
}

