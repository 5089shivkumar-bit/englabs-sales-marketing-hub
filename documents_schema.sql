
-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Client PO', 'Vendor PO', 'Vendor Invoice', 'Client Invoice', 'Delivery Challan', 'Agreement / NDA', 'Other')),
    tags TEXT[] DEFAULT '{}',
    file_url TEXT NOT NULL,
    file_type TEXT,
    size BIGINT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Policy (Open access for now as per other tables)
CREATE POLICY "Enable all access for project_documents" ON project_documents FOR ALL USING (true) WITH CHECK (true);
