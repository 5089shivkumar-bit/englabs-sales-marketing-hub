-- Add enquiry fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS enquiry_no TEXT,
ADD COLUMN IF NOT EXISTS last_date TEXT;
