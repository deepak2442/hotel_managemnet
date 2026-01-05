-- Add cancellation tracking columns to bookings table
-- This allows tracking cancellation charges, refund amounts, and cancellation timestamps

-- Add new cancellation tracking columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancellation_charge DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN bookings.cancellation_charge IS 'Amount charged for cancellation (0 = full refund)';
COMMENT ON COLUMN bookings.refund_amount IS 'Amount refunded to guest (advance_paid - cancellation_charge)';
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when booking was cancelled';

