-- ==========================================
-- CUSTOMER TABLE REPAIR SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ==========================================

DO $$ 
BEGIN 
    -- 1. Status Column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='status') THEN
        ALTER TABLE public.customers ADD COLUMN status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed'));
    END IF;

    -- 2. Address & Pincode
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='area_sector') THEN
        ALTER TABLE public.customers ADD COLUMN area_sector TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='pincode') THEN
        ALTER TABLE public.customers ADD COLUMN pincode TEXT;
    END IF;

    -- 3. Enquiry Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='enquiry_no') THEN
        ALTER TABLE public.customers ADD COLUMN enquiry_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='last_date') THEN
        ALTER TABLE public.customers ADD COLUMN last_date TEXT;
    END IF;

    -- 4. Industry & Machine Vertical
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='industry_type') THEN
        ALTER TABLE public.customers ADD COLUMN industry_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='machine_types') THEN
        ALTER TABLE public.customers ADD COLUMN machine_types TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='company_size') THEN
        ALTER TABLE public.customers ADD COLUMN company_size TEXT;
    END IF;

    -- 5. Geographic Coordinates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='coords') THEN
        ALTER TABLE public.customers ADD COLUMN coords JSONB;
    END IF;

    -- 6. Discovery Flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='is_discovered') THEN
        ALTER TABLE public.customers ADD COLUMN is_discovered BOOLEAN DEFAULT false;
    END IF;

END $$;

-- ==========================================
-- SCRIPT COMPLETE - CLICK 'RUN' IN SUPABASE
-- ==========================================
