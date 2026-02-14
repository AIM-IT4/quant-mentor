-- Run this in your Supabase SQL Editor

-- 1. Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS enable_ppp boolean DEFAULT false;

-- 2. Create storage bucket for product covers if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-covers', 'product-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for product-covers (Allow Public Access)
CREATE POLICY "Public Cover Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'product-covers' );

CREATE POLICY "Public Cover Upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'product-covers' );
