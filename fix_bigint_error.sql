-- FIX FOR "invalid input syntax for type bigint" ERROR
-- This changes numeric columns from bigint (integers only) to numeric (supports decimals)

-- Fix customers table
ALTER TABLE customers 
  ALTER COLUMN annual_turnover TYPE NUMERIC USING annual_turnover::numeric,
  ALTER COLUMN project_turnover TYPE NUMERIC USING project_turnover::numeric;

-- Fix pricing_history table (if it has similar issues)
ALTER TABLE pricing_history 
  ALTER COLUMN rate TYPE NUMERIC USING rate::numeric;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND column_name IN ('annual_turnover', 'project_turnover');
