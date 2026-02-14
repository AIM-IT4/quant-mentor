-- Product Reviews Setup SQL
-- Run this in Supabase SQL Editor to enable product-specific reviews

-- 1. Add new columns to products table for rating and sales count
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- 2. Create junction table for product-specific testimonials
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  testimonial_id bigint REFERENCES testimonials(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, testimonial_id)
);

-- 3. Enable Row Level Security
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for product_reviews

-- Public read access
DROP POLICY IF EXISTS "Public can view product reviews" ON product_reviews;
CREATE POLICY "Public can view product reviews"
  ON product_reviews FOR SELECT
  USING (true);

-- Admin insert access
DROP POLICY IF EXISTS "Enable insert for product reviews" ON product_reviews;
CREATE POLICY "Enable insert for product reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (true);

-- Admin update access
DROP POLICY IF EXISTS "Enable update for product reviews" ON product_reviews;
CREATE POLICY "Enable update for product reviews"
  ON product_reviews FOR UPDATE
  USING (true);

-- Admin delete access
DROP POLICY IF EXISTS "Enable delete for product reviews" ON product_reviews;
CREATE POLICY "Enable delete for product reviews"
  ON product_reviews FOR DELETE
  USING (true);

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_testimonial_id ON product_reviews(testimonial_id);
