-- Add new categories to project_documents table
-- We need to drop the existing check constraint and add a new one that includes the new categories

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_documents_category_check') THEN
        ALTER TABLE project_documents DROP CONSTRAINT project_documents_category_check;
    END IF;
END $$;

ALTER TABLE project_documents 
ADD CONSTRAINT project_documents_category_check 
CHECK (category IN (
    'Client PO', 
    'Vendor PO', 
    'Vendor Invoice', 
    'Client Invoice', 
    'Delivery Challan', 
    'Agreement / NDA', 
    'Drawings / Designs', 
    'Quality Reports', 
    'Other'
));
