-- ====================================================================
-- Wanderer's Journeys - Production PostgreSQL Migration
-- Migration: 001_initial_schema.sql
-- Description: Core relational schema for high-end hospitality CMS & CRM
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'MANAGER', 'LEAD_MANAGER');
CREATE TYPE lead_status_enum AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');
CREATE TYPE lead_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE email_status_enum AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- 3. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'usr_' || replace(uuid_generate_v4()::text, '-', ''),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'LEAD_MANAGER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. SESSIONS (Server-side revocation support)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 5. PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'settings_default',
    brand_name VARCHAR(255) NOT NULL DEFAULT 'Wanderer''s Journeys',
    slogan VARCHAR(255) NOT NULL,
    default_seo_title VARCHAR(255) NOT NULL,
    default_seo_description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    notification_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    social_links JSONB NOT NULL DEFAULT '{"facebook":"","instagram":"","tiktok":""}'::jsonb,
    footer_note TEXT,
    copyright VARCHAR(255),
    budget_comparison_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CORE SERVICES & INCLUSIONS
CREATE TABLE IF NOT EXISTS core_services (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    monthly_starting_price NUMERIC(10, 2) NOT NULL DEFAULT 2250.00,
    description TEXT NOT NULL,
    utility_allowance_note TEXT NOT NULL,
    resort_amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    personal_assistant TEXT NOT NULL,
    cleaning_schedule TEXT NOT NULL,
    internet_speed VARCHAR(100) NOT NULL,
    visa_support_note TEXT NOT NULL,
    health_insurance_support_note TEXT NOT NULL,
    banking_support_note TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ADDITIONAL FEE-BASED SERVICES
CREATE TABLE IF NOT EXISTS additional_services (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price_label VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    icon VARCHAR(64),
    conditions TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LIVING & RETIREMENT PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    tag VARCHAR(100),
    duration VARCHAR(100) NOT NULL,
    price_range VARCHAR(100) NOT NULL,
    is_custom_quote BOOLEAN NOT NULL DEFAULT FALSE,
    summary TEXT NOT NULL,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ideal_for TEXT,
    conditions TEXT,
    image_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_packages_code ON packages(code);

-- 10. ACCOMMODATIONS
CREATE TABLE IF NOT EXISTS accommodations (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 2,
    bathrooms INT NOT NULL DEFAULT 2,
    area_sqm INT NOT NULL,
    price_month_usd NUMERIC(10, 2) NOT NULL,
    is_quote_only BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accommodations_city ON accommodations(city);

-- 11. FAQS
CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

-- 12. DYNAMIC INQUIRY FORM FIELDS
CREATE TABLE IF NOT EXISTS inquiry_form_fields (
    id VARCHAR(64) PRIMARY KEY,
    field_key VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(32) NOT NULL,
    placeholder VARCHAR(255),
    help_text TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,
    options JSONB,
    validation_rule VARCHAR(255),
    section_group VARCHAR(64) NOT NULL DEFAULT 'personal'
);

-- 13. LEADS (Inquiries)
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(64) PRIMARY KEY,
    lead_code VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    country_code VARCHAR(100),
    expected_start_date DATE,
    duration VARCHAR(100),
    guest_count INT DEFAULT 1,
    age_groups VARCHAR(100),
    package_code VARCHAR(64),
    package_name VARCHAR(255),
    destination_city VARCHAR(100),
    preferred_accommodation_type VARCHAR(100),
    activities JSONB DEFAULT '[]'::jsonb,
    transport_preference VARCHAR(100),
    estimated_budget VARCHAR(100),
    additional_notes TEXT,
    consent_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    status lead_status_enum NOT NULL DEFAULT 'NEW',
    priority lead_priority_enum NOT NULL DEFAULT 'MEDIUM',
    assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'Website Inquiry Form',
    ip_address VARCHAR(45),
    user_agent TEXT,
    idempotency_key VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_destination_city ON leads(destination_city);
CREATE INDEX IF NOT EXISTS idx_leads_package_code ON leads(package_code);

-- 14. LEAD INTERNAL NOTES
CREATE TABLE IF NOT EXISTS lead_notes (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id),
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

-- 15. LEAD STATUS HISTORY
CREATE TABLE IF NOT EXISTS lead_status_history (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_status lead_status_enum NOT NULL,
    new_status lead_status_enum NOT NULL,
    changed_by_id VARCHAR(64) NOT NULL,
    changed_by_name VARCHAR(255) NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id);

-- 16. EMAIL JOBS OUTBOX
CREATE TABLE IF NOT EXISTS email_jobs (
    id VARCHAR(64) PRIMARY KEY,
    lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_preview TEXT,
    status email_status_enum NOT NULL DEFAULT 'QUEUED',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
