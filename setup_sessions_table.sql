-- Add Sessions Table for Dynamic 1-on-1 Mentorship
-- Run this in Supabase SQL Editor

-- 1. Create the Sessions Table
CREATE TABLE sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  features TEXT[], -- Array of features
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow public read access for active sessions
CREATE POLICY "Public sessions are viewable by everyone"
  ON sessions FOR SELECT
  USING (is_active = TRUE);

-- Allow insert/update/delete for admin (simplified)
CREATE POLICY "Enable insert for everyone"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for everyone"
  ON sessions FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for everyone"
  ON sessions FOR DELETE
  USING (true);

-- 4. Insert default sessions
INSERT INTO sessions (name, duration, price, description, features, is_popular) VALUES
  ('Free Test Session', 15, 0, 'Get a taste of quant mentorship with a quick introductory session.', 
   ARRAY['15-minute intro call', 'Discuss your goals', 'Brief Q&A', 'Free of charge'], FALSE),
  
  ('Quick Consultation', 30, 499, 'Focused session for specific questions or quick guidance.', 
   ARRAY['30 minutes one-on-one', 'Priority support', 'Topic-specific advice', 'Follow-up email'], FALSE),
  
  ('Deep Dive Session', 60, 999, 'Comprehensive mentorship covering multiple topics in depth.', 
   ARRAY['60 minutes deep dive', 'Most Popular', 'Multiple topics', 'Action plan', 'Resources shared'], TRUE),
  
  ('Interview Prep', 90, 1499, 'Intensive preparation for quant interviews with mock sessions.', 
   ARRAY['90 minutes intensive', 'Mock interview scenarios', 'Technical deep dive', 'Behavioral prep', 'Follow-up resources'], FALSE);
