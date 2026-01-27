

CREATE TABLE IF NOT EXISTS project_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    invoice_number TEXT,
    received_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('Pending', 'Received')),
    mode TEXT CHECK (mode IN ('Cash', 'Bank', 'UPI')) DEFAULT 'Bank',
    linked_to_commercial BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE project_incomes ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Enable all access for project_incomes" ON project_incomes FOR ALL USING (true) WITH CHECK (true);
