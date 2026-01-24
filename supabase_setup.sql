-- ==========================================
-- MASTER DATABASE FIX (VERSION 2.0)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ==========================================

-- 1. Create the Vendors Master Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    contact_person TEXT,
    mobile TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Repair and Upgrade Projects Table
-- This script safely checks and adds ALL missing columns
DO $$ 
BEGIN 
    -- Check for project_type column (Critical for In-House vs Vendor view)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_type') THEN
        ALTER TABLE public.projects ADD COLUMN project_type TEXT DEFAULT 'IN_HOUSE';
    END IF;

    -- Check for commercial_details column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='commercial_details') THEN
        ALTER TABLE public.projects ADD COLUMN commercial_details JSONB;
    END IF;

    -- Check for vendor_details column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='vendor_details') THEN
        ALTER TABLE public.projects ADD COLUMN vendor_details JSONB;
    END IF;

    -- Check for is_deleted column (Fixes fetch errors)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='is_deleted') THEN
        ALTER TABLE public.projects ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Security Check
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to vendors" ON public.vendors FOR ALL USING (true);

-- 4. Set existing projects to 'Vendor' if they have vendor details
-- (This fixes projects that already exist but aren't showing up)
UPDATE public.projects 
SET project_type = 'VENDOR' 
WHERE vendor_details IS NOT NULL AND (project_type = 'IN_HOUSE' OR project_type IS NULL);

-- 5. Create Extra Expenses Table
CREATE TABLE IF NOT EXISTS public.project_extra_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    mode TEXT NOT NULL,
    reference TEXT,
    remarks TEXT,
    added_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.project_extra_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to project_extra_expenses" ON public.project_extra_expenses FOR ALL USING (true);

-- ==========================================
-- SCRIPT COMPLETE - CLICK 'RUN' IN SUPABASE
-- ==========================================


