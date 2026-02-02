-- FIX PROJECTS TABLE SCHEMA - Add Missing Columns
-- Run this in Supabase SQL Editor to fix the projects table

-- Add missing location column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;

-- Add type column for IN_HOUSE/VENDOR classification
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IN_HOUSE';

-- Add constraint for type
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check 
CHECK (type IN ('IN_HOUSE', 'VENDOR'));

-- Update the status constraint to match the application
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('Active', 'Completed', 'On Hold'));

-- Confirmation
SELECT 'Projects table schema updated successfully!' as message;
