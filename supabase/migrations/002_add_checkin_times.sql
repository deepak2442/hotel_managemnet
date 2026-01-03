-- Add actual check-in and check-out time tracking to bookings table
-- This allows us to store the real arrival/departure time while billing is based on 12:00 PM normalization

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS actual_check_in_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_check_out_time TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN bookings.actual_check_in_time IS 'Actual time when guest checked in (for records). Billing is calculated from check_in_date at 12:00 PM.';
COMMENT ON COLUMN bookings.actual_check_out_time IS 'Actual time when guest checked out (for records).';

