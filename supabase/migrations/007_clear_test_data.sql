-- Clear All Test Data from Database
-- WARNING: This will delete ALL data from bookings, guests, and room_status_log
-- Rooms and Settings will be preserved but rooms will be reset to 'available' status
-- Run this script in Supabase SQL Editor to clear test data

-- Step 1: Delete all bookings (this will also cascade delete related room_status_log entries)
-- Since bookings references rooms and guests with ON DELETE CASCADE,
-- we need to delete bookings first
DELETE FROM bookings;

-- Step 2: Delete all guests (any remaining bookings will be cascade deleted)
DELETE FROM guests;

-- Step 3: Clean up any orphaned room_status_log entries (if any exist)
DELETE FROM room_status_log;

-- Step 4: Reset all rooms to 'available' status
UPDATE rooms SET status = 'available';

-- Step 5: (Optional) Reset settings to default values
-- Uncomment the lines below if you want to reset settings as well
-- DELETE FROM settings;
-- INSERT INTO settings (key, value) VALUES ('gst_rate', '18.00');

-- Verify deletion (these queries should return 0 rows)
-- SELECT COUNT(*) FROM bookings; -- Should be 0
-- SELECT COUNT(*) FROM guests; -- Should be 0
-- SELECT COUNT(*) FROM room_status_log; -- Should be 0
-- SELECT COUNT(*) FROM rooms WHERE status != 'available'; -- Should be 0

