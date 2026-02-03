# Supabase Setup Commands

-- 1. Create the Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  price numeric not null default 0,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table products enable row level security;

-- 3. Create Policy: Allow Public Read Access (Everyone can see products)
create policy "Public products are viewable by everyone"
  on products for select
  using ( true );

-- 4. Create Policy: Allow Public Insert/Update (For Admin Panel - Simplified)
-- In a real app, you would restrict this to authenticated users only.
-- For this simple implementation, we'll allow it but you should keep your Anon Key secret
-- or add a hardcoded "admin_secret" check if possible.
create policy "Enable insert for everyone"
  on products for insert
  with check ( true );

create policy "Enable update for everyone"
  on products for update
  using ( true );

-- 7. Create Bookings Table
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

-- 8. Enable Row Level Security for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 9. Create Policies for bookings
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

-- 10. Create indexes for better performance
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
