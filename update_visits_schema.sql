-- Add new columns to visits table for enhanced tracking

ALTER TABLE visits
ADD COLUMN IF NOT EXISTS transport_mode TEXT,
ADD COLUMN IF NOT EXISTS vehicle_no TEXT,
ADD COLUMN IF NOT EXISTS start_location TEXT,
ADD COLUMN IF NOT EXISTS end_location TEXT,
ADD COLUMN IF NOT EXISTS distance NUMERIC,

ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Bank', 'Credit', 'Other')),
ADD COLUMN IF NOT EXISTS expected_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Received', 'Pending', 'Not Discussed')),
ADD COLUMN IF NOT EXISTS expected_payment_date DATE,

ADD COLUMN IF NOT EXISTS call_logs JSONB DEFAULT '[]'::jsonb;
