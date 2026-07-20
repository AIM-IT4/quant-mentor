-- Migration: Add download_link to purchases table
-- Description: Adds a column to log the download link sent to the customer at the time of purchase.

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS download_link TEXT;
