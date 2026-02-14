-- Run this in Supabase SQL Editor to Fix Admin Panel Visibility

-- 1. Drop the restrictive "published only" policy
DROP POLICY IF EXISTS "Public can view published testimonials" ON testimonials;

-- 2. Create a new "Allow All Read" policy
-- This allows the Admin Panel (which uses the public key) to see unpublished reviews.
-- The public website script filters them out using .eq('is_published', true), so they remain hidden there.
CREATE POLICY "Public can view all testimonials"
  ON testimonials FOR SELECT
  USING (true);

-- 3. Ensure Insert policy exists (re-run just in case)
DROP POLICY IF EXISTS "Public can insert testimonials" ON testimonials;
create policy "Public can insert testimonials"
on "public"."testimonials"
as PERMISSIVE
for INSERT
to public
with check (true);

-- 4. Ensure Update/Delete policies exist for Admin (simulated via public key for this simple app)
-- Ideally you'd use authentication, but for this password-protected admin panel:
CREATE POLICY "Allow all updates"
  ON testimonials FOR UPDATE
  USING (true);

CREATE POLICY "Allow all deletes"
  ON testimonials FOR DELETE
  USING (true);
