-- Add status field to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed'));
