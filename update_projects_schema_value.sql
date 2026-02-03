-- Add total_value column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_value NUMERIC DEFAULT 0;
