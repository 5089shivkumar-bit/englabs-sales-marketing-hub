
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT CHECK (category IN ('Raw Material', 'Machining/Production', 'Labor', 'Packaging & Transport', 'Overheads', 'Other')),
    date DATE DEFAULT CURRENT_DATE,
    paid_by TEXT,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Policy (Open for now as per previous pattern, refine later)
CREATE POLICY "Enable all access for project_expenses" ON project_expenses FOR ALL USING (true) WITH CHECK (true);
