-- Add new columns to project_expenses table
ALTER TABLE project_expenses 
ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Bank')),
ADD COLUMN IF NOT EXISTS bill_photo TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Drop existing check constraint for category if it exists and add new one
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_expenses_category_check') THEN
        ALTER TABLE project_expenses DROP CONSTRAINT project_expenses_category_check;
    END IF;
END $$;

ALTER TABLE project_expenses 
ADD CONSTRAINT project_expenses_category_check 
CHECK (category IN ('Raw Material', 'Labor', 'Machine/Maintenance', 'Power/Utility', 'Other'));
