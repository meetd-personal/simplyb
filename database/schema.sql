-- Simply Business Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Business types enum
CREATE TYPE business_type AS ENUM (
    'FOOD_FRANCHISE',
    'RESTAURANT', 
    'RETAIL',
    'SERVICE',
    'OTHER'
);

-- Business roles enum
CREATE TYPE business_role AS ENUM (
    'OWNER',
    'MANAGER',
    'EMPLOYEE', 
    'ACCOUNTANT'
);

-- Businesses table
CREATE TABLE businesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type business_type NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    currency VARCHAR(3) DEFAULT 'CAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Business members (user-business relationships)
CREATE TABLE business_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    role business_role NOT NULL,
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, business_id)
);

-- Transaction types enum
CREATE TYPE transaction_type AS ENUM ('REVENUE', 'EXPENSE');

-- Transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    receipt_uri TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery platforms enum
CREATE TYPE delivery_platform AS ENUM (
    'UBER_EATS',
    'SKIP_THE_DISHES', 
    'DOORDASH',
    'GRUBHUB',
    'FOODORA'
);

-- Sync status enum
CREATE TYPE sync_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Delivery integrations table
CREATE TABLE delivery_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    platform delivery_platform NOT NULL,
    is_connected BOOLEAN DEFAULT false,
    api_credentials JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency VARCHAR(20) DEFAULT 'DAILY',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, platform)
);

-- Sync logs table
CREATE TABLE sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    integration_id UUID REFERENCES delivery_integrations(id) ON DELETE CASCADE,
    status sync_status NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_business_members_user_id ON business_members(user_id);
CREATE INDEX idx_business_members_business_id ON business_members(business_id);
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_delivery_integrations_business_id ON delivery_integrations(business_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow user creation during signup (service role can insert)
CREATE POLICY "Allow user creation during signup" ON users
    FOR INSERT WITH CHECK (true);

-- Business access based on membership
CREATE POLICY "Users can view businesses they're members of" ON businesses
    FOR SELECT USING (
        id IN (
            SELECT business_id FROM business_members 
            WHERE user_id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE POLICY "Business owners can update their businesses" ON businesses
    FOR UPDATE USING (owner_id::text = auth.uid()::text);

-- Allow business creation during signup
CREATE POLICY "Allow business creation" ON businesses
    FOR INSERT WITH CHECK (true);

-- Business members policies
CREATE POLICY "Users can view business memberships" ON business_members
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id::text = auth.uid()::text AND role = 'OWNER'
        )
    );

-- Allow business member creation during signup
CREATE POLICY "Allow business member creation" ON business_members
    FOR INSERT WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Users can view business transactions" ON transactions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_members 
            WHERE user_id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE POLICY "Users can insert transactions" ON transactions
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT business_id FROM business_members 
            WHERE user_id::text = auth.uid()::text AND is_active = true
        )
    );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_integrations_updated_at BEFORE UPDATE ON delivery_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO users (id, email, first_name, last_name) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'owner@pizzapalace.com', 'John', 'Smith'),
    ('550e8400-e29b-41d4-a716-446655440002', 'manager@pizzapalace.com', 'Sarah', 'Johnson');

INSERT INTO businesses (id, name, type, description, owner_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440101', 'Pizza Palace Downtown', 'FOOD_FRANCHISE', 'Premium pizza franchise location', '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440102', 'Cozy Corner Cafe', 'RESTAURANT', 'Local neighborhood cafe', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO business_members (user_id, business_id, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'OWNER'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'OWNER'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440101', 'MANAGER');
