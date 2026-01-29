-- Migration to fix data type mismatch in expos table
-- Change date column from DATE to TEXT to support range strings
ALTER TABLE expos ALTER COLUMN date TYPE TEXT;

-- Migration to ensure start_date and end_date columns exist and are handled correctly
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'start_date') THEN
        ALTER TABLE expos ADD COLUMN start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expos' AND column_name = 'end_date') THEN
        ALTER TABLE expos ADD COLUMN end_date DATE;
    END IF;
END $$;
