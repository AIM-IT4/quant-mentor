-- Admin-Initiated Reschedule Schema Changes
-- Run this in Supabase SQL Editor

-- 1. Add columns for admin-initiated reschedule
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_proposed_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_proposed_time TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_reschedule_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_reschedule_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_response TEXT; -- 'accepted', 'counter_proposed', null

-- 2. First, let's see what statuses currently exist (run this SELECT first to check)
-- SELECT DISTINCT status FROM bookings;

-- 3. Drop the existing constraint (if it exists)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 4. Add the updated constraint with ALL statuses (including new one)
-- This includes all possible statuses your system might have used
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN (
    'pending', 
    'confirmed', 
    'cancelled', 
    'completed', 
    'upcoming',
    'reschedule_requested', 
    'cancellation_requested', 
    'admin_reschedule_pending',
    'rescheduled'
  ));

-- 5. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_admin_reschedule ON bookings(status) WHERE status = 'admin_reschedule_pending';

-- Done! The schema now supports admin-initiated reschedules.
