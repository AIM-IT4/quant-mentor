-- Migration: Add country and normalized revenue tracking
-- Description: Adds columns to track customer location and consistent INR amounts for analytics.

-- 1. Update Purchases Table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS customer_country TEXT,
ADD COLUMN IF NOT EXISTS inr_amount DECIMAL;

-- 2. Update Bookings Table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_country TEXT;

-- 3. Update existing purchases: Try to guess country from currency if missing (Best effort)
UPDATE public.purchases 
SET customer_country = 'IN' 
WHERE customer_country IS NULL AND currency = 'INR';

UPDATE public.purchases 
SET inr_amount = amount 
WHERE inr_amount IS NULL AND currency = 'INR';
