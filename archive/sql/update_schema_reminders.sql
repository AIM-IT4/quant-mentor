-- Run this in Supabase SQL Editor to enable Reminder Emails

-- 1. Add columns to track if reminders have been sent
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_10m_sent BOOLEAN DEFAULT false;

-- 2. Verify columns were added (Optional check)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings';
