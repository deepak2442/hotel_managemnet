-- Make proof_type and proof_number nullable for advance bookings
-- Guests booking in advance (phone, website, etc.) may not have ID proof until check-in

ALTER TABLE guests 
ALTER COLUMN proof_type DROP NOT NULL;

ALTER TABLE guests 
ALTER COLUMN proof_number DROP NOT NULL;

-- Update the check constraint to allow NULL values
ALTER TABLE guests 
DROP CONSTRAINT IF EXISTS guests_proof_type_check;

ALTER TABLE guests 
ADD CONSTRAINT guests_proof_type_check 
CHECK (proof_type IS NULL OR proof_type IN ('aadhar', 'pan', 'driving_license'));

