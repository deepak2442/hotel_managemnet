-- Add payment tracking columns to bookings table
-- This allows tracking QR, Cash, and Extended payments separately

-- Add new payment tracking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS qr_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS extended_amount DECIMAL(10, 2) DEFAULT 0;

-- Update payment_method constraint to allow 'cash', 'qr', or 'mixed'
-- First, drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

-- Add new constraint allowing multiple payment methods
ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IN ('cash', 'qr', 'mixed'));

-- Migrate existing data: assume all existing payments were cash
UPDATE bookings 
SET 
  cash_amount = amount_paid,
  qr_amount = 0,
  extended_amount = 0,
  payment_method = 'cash'
WHERE qr_amount = 0 AND cash_amount = 0;

-- Add comment for documentation
COMMENT ON COLUMN bookings.qr_amount IS 'Amount paid via QR code';
COMMENT ON COLUMN bookings.cash_amount IS 'Amount paid via cash';
COMMENT ON COLUMN bookings.extended_amount IS 'Amount paid for extended stay or additional charges';


