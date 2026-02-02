-- ========================================
-- COMPLETE DATABASE FIX FOR MARK-ENG HUB
-- Run this in Supabase SQL Editor
-- ========================================

-- FIX 1: CUSTOMERS TABLE
-- Adds missing columns and fixes status constraint for customer imports
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
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
ALTER TABLE customers ADD CONSTRAINT customers_status_check 
CHECK (status IN ('active', 'inactive', 'prospective', 'lead', 'churned', 'Open', 'Closed'));

-- FIX 2: PROJECTS TABLE
-- Adds missing location and type columns for project imports
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IN_HOUSE';
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check 
CHECK (type IN ('IN_HOUSE', 'VENDOR'));
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('Active', 'Completed', 'On Hold'));

-- Confirmation message
SELECT 
  '✅ Database schema updated successfully!' as message,
  'You can now import customers and projects from Excel files!' as next_step;
