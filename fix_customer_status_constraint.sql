-- FIX CUSTOMER STATUS CONSTRAINT
-- Run this in Supabase SQL Editor to resolve the schema mismatch

-- Step 1: Drop the existing constraint if it exists
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check;

-- Step 2: Add the column if it doesn't exist (with no constraint yet)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';

-- Step 3: Add new constraint that supports both old and new status values
ALTER TABLE customers ADD CONSTRAINT customers_status_check 
CHECK (status IN ('active', 'inactive', 'prospective', 'lead', 'churned', 'Open', 'Closed'));

-- Step 4: Add missing columns for the import system
ALTER TABLE customers ADD COLUMN IF NOT EXISTS area_sector TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS enquiry_no TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_date TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry_type TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS machine_types JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS coords JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_discovered BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industrial_hub TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zone TEXT;

-- Confirmation message
SELECT 'Customer status constraint updated successfully! You can now import with Open/Closed status values.' as message;
