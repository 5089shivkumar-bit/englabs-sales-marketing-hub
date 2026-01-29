-- Migration to enhance expos table with additional details
ALTER TABLE expos 
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS organizer_name TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update existing records with default event_type if necessary
UPDATE expos SET event_type = 'Expo / Trade Fair' WHERE event_type IS NULL;
