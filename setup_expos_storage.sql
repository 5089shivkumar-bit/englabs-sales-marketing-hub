-- Run this in the Supabase SQL Editor to enable file uploads for Expos

-- 1. Create the 'expos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('expos', 'expos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow anyone to view documents
CREATE POLICY "Expos Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'expos');

-- 3. Policy: Allow anyone to upload documents
-- Note: In production, you might want to restrict this to 'authenticated' users
CREATE POLICY "Expos Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'expos');

-- 4. Policy: Allow anyone to update their own uploads (basic)
CREATE POLICY "Expos Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'expos');
