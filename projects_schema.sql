
-- 7. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('Active', 'Completed', 'On Hold')),
    created_by TEXT, -- Could be a UUID if we had a users table, but simple Text for now
    company_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON projects FOR ALL USING (true) WITH CHECK (true);
