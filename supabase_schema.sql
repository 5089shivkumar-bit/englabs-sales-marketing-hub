-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS consumers ( -- Renaming to consumers as 'table' is reserved, but wait, 'customers' is fine.
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    annual_turnover BIGINT,
    project_turnover BIGINT,
    industry TEXT,
    last_modified_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    designation TEXT,
    email TEXT,
    phone TEXT
);

-- 3. Pricing History Table
CREATE TABLE IF NOT EXISTS pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
    tech TEXT NOT NULL,
    rate NUMERIC,
    unit TEXT,
    date DATE DEFAULT CURRENT_DATE
);

-- 4. Expos Table
CREATE TABLE IF NOT EXISTS expos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE,
    location TEXT,
    industry TEXT,
    region TEXT,
    link TEXT
);

-- 5. Visits Table
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
    customer_name TEXT, -- Redundant but useful for display without joins if needed, usually better to join.
    date DATE DEFAULT CURRENT_DATE,
    purpose TEXT,
    assigned_to TEXT,
    status TEXT,
    notes TEXT
);

-- 6. Profiles Table (for Users)
-- This table is separate from auth.users for now, but can be linked later.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('Admin', 'Sales', 'Marketing', 'Marketing Lead', 'System Administrator', 'Growth Lead', 'Market Analyst')),
    avatar TEXT,
    phone TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table aliases if needed or just rename 'consumers' back to 'customers' if I made a mistake thinking it was reserved. 
-- 'customers' is NOT a reserved keyword in Postgres. I will use 'customers'.

ALTER TABLE IF EXISTS consumers RENAME TO customers;

-- Add RLS (Row Level Security) Policies (Optional but recommended)
-- For now, we enabled RLS but allow public access for simplicity until Auth is fully set up.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE expos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow everything for anon (public) for now, so the app works immediately.
-- WARNING: This is for development only.
CREATE POLICY "Enable all access for all users" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON pricing_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON expos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON profiles FOR ALL USING (true) WITH CHECK (true);
