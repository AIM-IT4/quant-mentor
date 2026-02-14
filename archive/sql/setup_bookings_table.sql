-- Add Bookings Table for Session Management
-- Run this in Supabase SQL Editor

-- 1. Create the Bookings Table
CREATE TABLE bookings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  service_name TEXT NOT NULL,
  service_price INTEGER NOT NULL DEFAULT 0,
  service_duration INTEGER NOT NULL DEFAULT 30,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meet_link TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow public read access for their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (email = auth.email());

-- Allow insert for authenticated users
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (email = auth.email());

-- Allow update for authenticated users (for rescheduling/cancelling)
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (email = auth.email());

-- Allow delete for authenticated users
CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (email = auth.email());

-- 4. Create indexes for better performance
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();