-- Add 'reserved' status for advance bookings
-- This allows bookings to be made for future dates without marking rooms as occupied

ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('checked_in', 'checked_out', 'cancelled', 'reserved'));

-- Add comment for documentation
COMMENT ON COLUMN bookings.status IS 'checked_in: Guest has checked in. reserved: Advance booking for future date. checked_out: Guest has checked out. cancelled: Booking was cancelled.';

