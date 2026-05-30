-- Adds optional product preview metadata for richer product detail pages.
-- These fields are rendered on product.html when present; the frontend also
-- provides fallback preview content for older products.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preview_summary TEXT,
  ADD COLUMN IF NOT EXISTS preview_table_of_contents TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS preview_target_audience TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS preview_prerequisites TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS preview_expected_outcomes TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS preview_sample_images TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS preview_sample_text TEXT;
