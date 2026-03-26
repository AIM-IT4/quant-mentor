-- Create recommendation_emails table for scheduled post-purchase emails
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recommendation_emails (
    id SERIAL PRIMARY KEY,
    customer_email TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Customer',
    purchased_product TEXT NOT NULL,
    send_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the cron query (unsent + ready to send)
CREATE INDEX IF NOT EXISTS idx_recommendation_pending
    ON recommendation_emails (sent, send_at)
    WHERE sent = FALSE;

-- Index for deduplication check
CREATE INDEX IF NOT EXISTS idx_recommendation_email_product
    ON recommendation_emails (customer_email, purchased_product);

-- Enable RLS (Row Level Security) - allow service key full access
ALTER TABLE recommendation_emails ENABLE ROW LEVEL SECURITY;

-- Policy: allow service role to do everything
CREATE POLICY "Service role full access" ON recommendation_emails
    FOR ALL
    USING (true)
    WITH CHECK (true);
