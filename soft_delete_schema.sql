
-- Add is_deleted column for Soft Delete
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
