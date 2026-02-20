-- Clinic Audit SaaS - Multi-Tenant Database Schema
-- PostgreSQL Schema

-- ============================================
-- CLINICS TABLE
-- ============================================
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- GLOBAL GOALS TABLE (Per Clinic)
-- ============================================
CREATE TABLE global_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    revenue_goal DECIMAL(12, 2) DEFAULT 100000,
    profit_margin_goal DECIMAL(5, 2) DEFAULT 30,
    capacity_goal DECIMAL(5, 2) DEFAULT 80,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id)
);

CREATE INDEX idx_global_goals_clinic_id ON global_goals(clinic_id);

-- ============================================
-- MONTHLY AUDITS TABLE
-- ============================================
CREATE TABLE monthly_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    audit_month DATE NOT NULL, -- YYYY-MM-01 format
    clinic_name VARCHAR(255),
    revenue DECIMAL(12, 2) DEFAULT 0,
    operating_expenses DECIMAL(12, 2) DEFAULT 0,
    cogs DECIMAL(12, 2) DEFAULT 0,
    website_visits INTEGER DEFAULT 0,
    website_conversion_rate DECIMAL(5, 2) DEFAULT 0,
    new_client_visits INTEGER DEFAULT 0,
    clients_converting_to_treatment INTEGER DEFAULT 0,
    total_clients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    marketing_spend DECIMAL(12, 2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id, audit_month)
);

CREATE INDEX idx_monthly_audits_clinic_id ON monthly_audits(clinic_id);
CREATE INDEX idx_monthly_audits_audit_month ON monthly_audits(audit_month);

-- ============================================
-- PAYROLL ITEMS TABLE
-- ============================================
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_audit_id UUID NOT NULL REFERENCES monthly_audits(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payroll_items_audit_id ON payroll_items(monthly_audit_id);

-- ============================================
-- ADDITIONAL EXPENSES TABLE
-- ============================================
CREATE TABLE additional_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_audit_id UUID NOT NULL REFERENCES monthly_audits(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_additional_expenses_audit_id ON additional_expenses(monthly_audit_id);

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_audit_id UUID NOT NULL REFERENCES monthly_audits(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider_hours DECIMAL(10, 2) DEFAULT 0,
    booked_hours DECIMAL(10, 2) DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    commission DECIMAL(12, 2) DEFAULT 0,
    allocated_expenses DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_services_audit_id ON services(monthly_audit_id);

-- ============================================
-- INVITATIONS TABLE (For inviting users)
-- ============================================
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_clinic_id ON invitations(clinic_id);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ============================================
-- AUDIT LOG TABLE (Optional but recommended for SaaS)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_goals_updated_at BEFORE UPDATE ON global_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_audits_updated_at BEFORE UPDATE ON monthly_audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_items_updated_at BEFORE UPDATE ON payroll_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_expenses_updated_at BEFORE UPDATE ON additional_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample clinic
INSERT INTO clinics (id, name, location) VALUES
('11111111-1111-1111-1111-111111111111', 'Demo Wellness Clinic', 'San Francisco, CA');

-- Insert sample admin user (password: "password123")
INSERT INTO users (id, email, password_hash, first_name, last_name, role, clinic_id) VALUES
('22222222-2222-2222-2222-222222222222', 'admin@democlinic.com', '$2b$10$X7KxqKxqKxqKxqKxqKxqKe', 'John', 'Admin', 'admin', '11111111-1111-1111-1111-111111111111');

-- Insert default global goals
INSERT INTO global_goals (clinic_id) VALUES ('11111111-1111-1111-1111-111111111111');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE clinics IS 'Top-level tenant entity - each clinic is isolated';
COMMENT ON TABLE users IS 'User accounts - each user belongs to one clinic';
COMMENT ON TABLE monthly_audits IS 'Monthly audit data - scoped to clinic';
COMMENT ON TABLE global_goals IS 'Clinic-wide goals used for scoring';
COMMENT ON TABLE invitations IS 'Email invitations to join a clinic';
COMMENT ON COLUMN users.role IS 'admin: manage goals & invite users, member: enter data & view dashboards';
