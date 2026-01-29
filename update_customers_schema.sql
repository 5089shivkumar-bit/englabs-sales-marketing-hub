-- Add address fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS area_sector TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT;
