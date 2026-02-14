-- Run this in Supabase SQL Editor to enable Testimonials

-- 1. Create Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  product TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Allow Public Read (only published)
CREATE POLICY "Public can view published testimonials"
  ON testimonials FOR SELECT
  USING (is_published = true);

-- Allow Anonymous/Public Insert (for submitting reviews)
create policy "Public can insert testimonials"
on "public"."testimonials"
as PERMISSIVE
for INSERT
to public
with check (true);

-- Allow Admin Full Access (Service Role)
-- (Service role ignores RLS by default, but good to be explicit for authenticated admin users if you implement auth)
CREATE POLICY "Admins can do everything"
  ON testimonials FOR ALL
  USING (auth.role() = 'authenticated');
