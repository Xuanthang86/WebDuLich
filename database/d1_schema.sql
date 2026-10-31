-- ====================================================================
-- Wanderer's Journeys - Cloudflare D1 (SQLite) Schema
-- Database: wanderers_journeys_d1
-- Compatible with Cloudflare Workers / Cloudflare Pages Functions
-- ====================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'LEAD_MANAGER')),
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. SESSIONS (Revocable Session Store)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings_default',
    brand_name TEXT NOT NULL DEFAULT 'Wanderer''s Journeys',
    slogan TEXT NOT NULL,
    default_seo_title TEXT NOT NULL,
    default_seo_description TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    notification_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    social_links TEXT NOT NULL DEFAULT '{}',
    footer_note TEXT,
    copyright TEXT,
    budget_comparison_message TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. HERO CONTENT
CREATE TABLE IF NOT EXISTS hero_content (
    id TEXT PRIMARY KEY DEFAULT 'hero_default',
    headline TEXT NOT NULL,
    tagline TEXT NOT NULL,
    subtext TEXT NOT NULL,
    primary_cta_text TEXT NOT NULL,
    secondary_cta_text TEXT NOT NULL,
    badge_text TEXT,
    background_image_url TEXT,
    stats TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. WHY VIETNAM
CREATE TABLE IF NOT EXISTS why_vietnam (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    description TEXT NOT NULL,
    highlights TEXT NOT NULL DEFAULT '[]',
    icon TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. WHY CHOOSE US
CREATE TABLE IF NOT EXISTS why_choose_us (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1
);

-- 8. CORE SERVICES & INCLUSIONS
CREATE TABLE IF NOT EXISTS core_services (
    id TEXT PRIMARY KEY DEFAULT 'core_default',
    title TEXT NOT NULL,
    monthly_starting_price REAL NOT NULL DEFAULT 2250.00,
    description TEXT NOT NULL,
    utility_allowance_note TEXT NOT NULL,
    resort_amenities TEXT NOT NULL DEFAULT '[]',
    personal_assistant TEXT NOT NULL,
    cleaning_schedule TEXT NOT NULL,
    internet_speed TEXT NOT NULL,
    visa_support_note TEXT NOT NULL,
    health_insurance_support_note TEXT NOT NULL,
    banking_support_note TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. ADDITIONAL SERVICES
CREATE TABLE IF NOT EXISTS additional_services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_label TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    conditions TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    package_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    duration_label TEXT NOT NULL,
    duration_category TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    starting_price_usd REAL NOT NULL,
    description TEXT NOT NULL,
    ideal_for TEXT NOT NULL DEFAULT '[]',
    inclusions TEXT NOT NULL DEFAULT '[]',
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10b. DESTINATION HUBS (Cities & Provinces)
CREATE TABLE IF NOT EXISTS destination_hubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    hub_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_class TEXT NOT NULL DEFAULT 'bg-emerald-100 text-emerald-800 border-emerald-300',
    hero_image TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_destination_hubs_name ON destination_hubs(name);

-- 11. ACCOMMODATIONS
CREATE TABLE IF NOT EXISTS accommodations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    room_type TEXT NOT NULL,
    size_sqm INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    price_month_usd REAL NOT NULL,
    description TEXT NOT NULL,
    features TEXT NOT NULL DEFAULT '[]',
    nearby_amenities TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    is_flagship INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. FAQS
CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. DYNAMIC FORM FIELDS
CREATE TABLE IF NOT EXISTS form_fields (
    id TEXT PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    placeholder TEXT,
    options TEXT NOT NULL DEFAULT '[]',
    display_order INTEGER NOT NULL DEFAULT 1,
    validation_rule TEXT
);

-- 14. LEADS & INQUIRIES
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    lead_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country_code TEXT NOT NULL,
    expected_start_date TEXT,
    duration TEXT,
    guest_count INTEGER NOT NULL DEFAULT 1,
    age_groups TEXT NOT NULL DEFAULT '[]',
    package_code TEXT,
    package_name TEXT,
    destination_city TEXT,
    preferred_accommodation_type TEXT,
    activities TEXT NOT NULL DEFAULT '[]',
    transport_preference TEXT,
    estimated_budget TEXT,
    additional_notes TEXT,
    consent_accepted INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK(status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')),
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- 15. LEAD NOTES
CREATE TABLE IF NOT EXISTS lead_notes (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. LEAD STATUS HISTORY
CREATE TABLE IF NOT EXISTS lead_status_history (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by_id TEXT NOT NULL,
    changed_by_name TEXT NOT NULL,
    note TEXT,
    changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- 18. EMAIL OUTBOX JOBS
CREATE TABLE IF NOT EXISTS email_jobs (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_preview TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED', 'SENT', 'SIMULATED', 'FAILED')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    scheduled_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT,
    last_error TEXT
);

-- 19. MEDIA ASSETS
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
