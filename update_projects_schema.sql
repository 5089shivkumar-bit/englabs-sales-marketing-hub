
-- Add location column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
