-- Run this in your Supabase SQL Editor to create the blogs table
-- This is required for the blog functionality to work

-- Create the Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow Public Read Access for Published Blogs Only
CREATE POLICY "Public can view published blogs"
  ON blogs FOR SELECT
  USING ( is_published = true );

-- Create Policy: Allow All Operations (for Admin Panel - uses Service Role Key)
-- Note: In production, you should restrict this to authenticated admin users
CREATE POLICY "Enable all operations for service role"
  ON blogs FOR ALL
  USING ( true )
  WITH CHECK ( true );

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

-- Create index on is_published for filtering
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_blogs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at 
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blogs_updated_at_column();

-- Insert sample blog post (optional - remove if not needed)
-- INSERT INTO blogs (title, slug, excerpt, content, is_published) 
-- VALUES (
--   'Welcome to QuantMentor Blog',
--   'welcome-to-quantmentor-blog',
--   'Your journey to becoming a quantitative finance expert starts here.',
--   '<p>Welcome to our blog where we share insights, tips, and resources for quantitative finance professionals.</p>',
--   true
-- );
