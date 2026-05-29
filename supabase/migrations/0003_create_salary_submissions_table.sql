-- migration_name: 0003_create_salary_submissions_table.sql
-- Description: Create salary_submissions table and configure public anonymous RLS policies

-- Create salary_submissions table if it does not exist
CREATE TABLE IF NOT EXISTS public.salary_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    firm_name TEXT NOT NULL,
    role TEXT NOT NULL,
    level TEXT NOT NULL,
    years_of_experience INTEGER NOT NULL,
    base_salary NUMERIC NOT NULL,
    bonus NUMERIC DEFAULT 0,
    equity NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD' NOT NULL,
    education TEXT,
    gender TEXT,
    linkedin_url TEXT,
    is_seed BOOLEAN DEFAULT false NOT NULL,
    is_approved BOOLEAN DEFAULT false NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.salary_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent duplicates
DROP POLICY IF EXISTS "Allow public anonymous inserts" ON public.salary_submissions;
DROP POLICY IF EXISTS "Allow public read of approved submissions" ON public.salary_submissions;

-- Policy to allow anyone (even unauthenticated anonymous users) to submit a salary
CREATE POLICY "Allow public anonymous inserts" 
ON public.salary_submissions 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow anyone (public) to view approved and seed submissions
CREATE POLICY "Allow public read of approved submissions" 
ON public.salary_submissions 
FOR SELECT 
USING (is_approved = true OR is_seed = true);
