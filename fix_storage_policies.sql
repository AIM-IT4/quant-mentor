-- Run this in your Supabase SQL Editor to allow file deletion
-- This is NECESSARY for cleanup and for the admin panel to manage storage

-- 1. Allow deletion from 'resources' bucket
CREATE POLICY "Enable delete for everyone"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'resources' );

-- 2. Allow deletion from 'product-covers' bucket
CREATE POLICY "Enable delete for cover images"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'product-covers' );

-- 3. Allow update (standardized)
CREATE POLICY "Enable update for resources"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'resources' );

CREATE POLICY "Enable update for product-covers"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'product-covers' );
