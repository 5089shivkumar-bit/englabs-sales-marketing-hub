-- EXPOS & EVENTS CONSOLIDATED FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. FIX TABLE SCHEMA
-- Ensure table exists first (if not already created)
CREATE TABLE IF NOT EXISTS expos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date TEXT, -- Changed from DATE to TEXT to support ranges like "Jan 1 to Jan 5"
    location TEXT,
    industry TEXT,
    region TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure date column is TEXT (in case it was already created as DATE)
ALTER TABLE expos ALTER COLUMN date TYPE TEXT;

-- Add all Phase 1-3 columns if they don't exist
DO $$ 
BEGIN 
    -- Basic Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'event_type') THEN
        ALTER TABLE expos ADD COLUMN event_type TEXT DEFAULT 'Expo / Trade Fair';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'organizer_name') THEN
        ALTER TABLE expos ADD COLUMN organizer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'website') THEN
        ALTER TABLE expos ADD COLUMN website TEXT;
    END IF;

    -- Date & Location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'start_date') THEN
        ALTER TABLE expos ADD COLUMN start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'end_date') THEN
        ALTER TABLE expos ADD COLUMN end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'city') THEN
        ALTER TABLE expos ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'state') THEN
        ALTER TABLE expos ADD COLUMN state TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'venue') THEN
        ALTER TABLE expos ADD COLUMN venue TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'zone') THEN
        ALTER TABLE expos ADD COLUMN zone TEXT;
    END IF;

    -- Participation & Planning
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'participation_type') THEN
        ALTER TABLE expos ADD COLUMN participation_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'stall_no') THEN
        ALTER TABLE expos ADD COLUMN stall_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'booth_size') THEN
        ALTER TABLE expos ADD COLUMN booth_size TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'fee_cost') THEN
        ALTER TABLE expos ADD COLUMN fee_cost NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'registration_status') THEN
        ALTER TABLE expos ADD COLUMN registration_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'assigned_team') THEN
        ALTER TABLE expos ADD COLUMN assigned_team TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'visit_plan') THEN
        ALTER TABLE expos ADD COLUMN visit_plan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'transport_mode') THEN
        ALTER TABLE expos ADD COLUMN transport_mode TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'hotel_details') THEN
        ALTER TABLE expos ADD COLUMN hotel_details TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'budget') THEN
        ALTER TABLE expos ADD COLUMN budget NUMERIC DEFAULT 0;
    END IF;

    -- Outcome & Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'status') THEN
        ALTER TABLE expos ADD COLUMN status TEXT DEFAULT 'upcoming';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'leads_generated') THEN
        ALTER TABLE expos ADD COLUMN leads_generated INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'hot_leads') THEN
        ALTER TABLE expos ADD COLUMN hot_leads INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'warm_leads') THEN
        ALTER TABLE expos ADD COLUMN warm_leads INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'cold_leads') THEN
        ALTER TABLE expos ADD COLUMN cold_leads INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'orders_received') THEN
        ALTER TABLE expos ADD COLUMN orders_received NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'pipeline_inquiries') THEN
        ALTER TABLE expos ADD COLUMN pipeline_inquiries INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'new_contacts') THEN
        ALTER TABLE expos ADD COLUMN new_contacts INTEGER DEFAULT 0;
    END IF;

    -- Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'brochure_link') THEN
        ALTER TABLE expos ADD COLUMN brochure_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'entry_pass_link') THEN
        ALTER TABLE expos ADD COLUMN entry_pass_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'stall_layout_link') THEN
        ALTER TABLE expos ADD COLUMN stall_layout_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'photos_link') THEN
        ALTER TABLE expos ADD COLUMN photos_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'visitor_list_link') THEN
        ALTER TABLE expos ADD COLUMN visitor_list_link TEXT;
    END IF;
END $$;


-- 2. SETUP STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('expos', 'expos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access (View and Upload)
CREATE POLICY "Expos Public View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'expos');
CREATE POLICY "Expos Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'expos');
CREATE POLICY "Expos Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'expos');
CREATE POLICY "Expos Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'expos');

-- Enable RLS for buckets just in case it's restricted
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
