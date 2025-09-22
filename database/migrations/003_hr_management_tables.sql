-- Migration: Add HR Management Tables
-- This adds tables for employee schedules, payroll, time-off requests, and work sessions

-- Add hourly_rate to business_members table
ALTER TABLE business_members 
ADD COLUMN hourly_rate DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN overtime_rate DECIMAL(8,2) DEFAULT 0.00;

-- Create schedule status enum
CREATE TYPE schedule_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');

-- Employee schedules table
CREATE TABLE employee_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES business_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 30, -- minutes
    notes TEXT,
    status schedule_status DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time off request types and status enums
CREATE TYPE time_off_type AS ENUM ('vacation', 'sick', 'personal', 'emergency');
CREATE TYPE time_off_status AS ENUM ('pending', 'approved', 'denied');

-- Time off requests table
CREATE TABLE time_off_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES business_members(id) ON DELETE CASCADE,
    type time_off_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status time_off_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll period status enum
CREATE TYPE payroll_status AS ENUM ('current', 'completed', 'upcoming');

-- Payroll periods table
CREATE TABLE payroll_periods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status payroll_status DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll entries table
CREATE TABLE payroll_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES business_members(id) ON DELETE CASCADE,
    payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    regular_hours DECIMAL(8,2) DEFAULT 0.00,
    overtime_hours DECIMAL(8,2) DEFAULT 0.00,
    hourly_rate DECIMAL(8,2) NOT NULL,
    overtime_rate DECIMAL(8,2) NOT NULL,
    gross_pay DECIMAL(10,2) DEFAULT 0.00,
    deductions DECIMAL(10,2) DEFAULT 0.00,
    net_pay DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work sessions table for time tracking
CREATE TABLE work_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES business_members(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES employee_schedules(id) ON DELETE SET NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    break_duration INTEGER DEFAULT 0, -- minutes
    total_hours DECIMAL(8,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_employee_schedules_business_id ON employee_schedules(business_id);
CREATE INDEX idx_employee_schedules_employee_id ON employee_schedules(employee_id);
CREATE INDEX idx_employee_schedules_date ON employee_schedules(date);
CREATE INDEX idx_time_off_requests_business_id ON time_off_requests(business_id);
CREATE INDEX idx_time_off_requests_employee_id ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_payroll_periods_business_id ON payroll_periods(business_id);
CREATE INDEX idx_payroll_entries_business_id ON payroll_entries(business_id);
CREATE INDEX idx_payroll_entries_employee_id ON payroll_entries(employee_id);
CREATE INDEX idx_work_sessions_business_id ON work_sessions(business_id);
CREATE INDEX idx_work_sessions_employee_id ON work_sessions(employee_id);

-- Enable RLS on new tables
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_schedules
CREATE POLICY "Business members can view schedules" ON employee_schedules
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can manage schedules" ON employee_schedules
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

-- RLS Policies for time_off_requests
CREATE POLICY "Employees can view own requests" ON time_off_requests
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

CREATE POLICY "Employees can create requests" ON time_off_requests
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can update requests" ON time_off_requests
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

-- RLS Policies for payroll_periods
CREATE POLICY "Business members can view payroll periods" ON payroll_periods
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can manage payroll periods" ON payroll_periods
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

-- RLS Policies for payroll_entries
CREATE POLICY "Employees can view own payroll" ON payroll_entries
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

CREATE POLICY "Managers can manage payroll entries" ON payroll_entries
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

-- RLS Policies for work_sessions
CREATE POLICY "Employees can view own sessions" ON work_sessions
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

CREATE POLICY "Employees can manage own sessions" ON work_sessions
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM business_members
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid()
            AND role IN ('OWNER', 'MANAGER')
            AND is_active = true
        )
    );

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_employee_schedules_updated_at BEFORE UPDATE ON employee_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON payroll_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON payroll_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at BEFORE UPDATE ON work_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
