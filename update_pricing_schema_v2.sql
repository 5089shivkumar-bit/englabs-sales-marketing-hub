-- Migration script to update pricing_history table with enhanced fields

ALTER TABLE pricing_history 
ADD COLUMN IF NOT EXISTS sales_person TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS drawing_no TEXT,
ADD COLUMN IF NOT EXISTS material_type TEXT,
ADD COLUMN IF NOT EXISTS machine_type TEXT,
ADD COLUMN IF NOT EXISTS process TEXT,
ADD COLUMN IF NOT EXISTS moq INTEGER,
ADD COLUMN IF NOT EXISTS quoted_qty INTEGER,
ADD COLUMN IF NOT EXISTS raw_material_cost NUMERIC,
ADD COLUMN IF NOT EXISTS machining_cost NUMERIC,
ADD COLUMN IF NOT EXISTS labor_cost NUMERIC,
ADD COLUMN IF NOT EXISTS overhead NUMERIC,
ADD COLUMN IF NOT EXISTS transportation_cost NUMERIC,
ADD COLUMN IF NOT EXISTS other_charges NUMERIC,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS margin_percent NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS valid_till DATE,
ADD COLUMN IF NOT EXISTS payment_mode TEXT,
ADD COLUMN IF NOT EXISTS credit_days INTEGER,
ADD COLUMN IF NOT EXISTS advance_percent NUMERIC,
ADD COLUMN IF NOT EXISTS gst_included BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';

-- Add check constraint for status if desired
-- ALTER TABLE pricing_history ADD CONSTRAINT status_check CHECK (status IN ('Draft', 'Sent to Client', 'Approved', 'Rejected', 'Revised'));
