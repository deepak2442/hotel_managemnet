-- Add GSTIN column to bookings table
-- This allows each booking to have its own GSTIN (useful for corporate bookings)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS gstin TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bookings.gstin IS 'GSTIN number for corporate bookings (optional)';

