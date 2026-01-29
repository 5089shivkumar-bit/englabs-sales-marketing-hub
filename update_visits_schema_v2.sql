-- Add JSONB columns for advanced visit details
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS met_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
