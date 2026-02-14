-- Add missing columns to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Re-verify the table structure
CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') NOT NULL
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public insert (so customers can log their purchases)
DROP POLICY IF EXISTS "Public can insert purchases" ON purchases;
CREATE POLICY "Public can insert purchases" 
  ON purchases FOR INSERT 
  WITH CHECK (true);

-- Allow public read (Admin will use Anon/Service key to read)
DROP POLICY IF EXISTS "Public can view purchases" ON purchases;
CREATE POLICY "Public can view purchases" 
  ON purchases FOR SELECT 
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_name);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at);
