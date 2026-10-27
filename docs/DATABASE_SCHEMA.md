# Wanderer’s Journeys — Database Schema & ERD Specification

## 1. Entity Relationship Overview

```
 ┌──────────────┐         ┌──────────────┐
 │    users     │<───────┤   sessions   │
 └──────┬───────┘         └──────────────┘
        │
        │ 1:N
        ├────────────────┐
        ▼                ▼
 ┌──────────────┐ ┌──────────────┐
 │ lead_notes   │ │  audit_logs  │
 └──────────────┘ └──────────────┘
        ▲
        │ N:1
 ┌──────┴───────┐ 1:N     ┌─────────────────────┐
 │    leads     ├────────>│ lead_status_history │
 └──────┬───────┘         └─────────────────────┘
        │ 1:1 (optional)
        ▼
 ┌──────────────┐
 │  email_jobs  │
 └──────────────┘

 Independent CMS Entities:
 • site_settings
 • packages
 • accommodations
 • core_services & additional_services
 • faqs
 • inquiry_form_fields
 • media_assets
```

---

## 2. Table Catalog & Data Dictionary

### 2.1. `users`
Represents internal administrators, managers, and concierge lead coordinators.
* `id` (`VARCHAR(64)` PK): Unique identifier (`usr_...`).
* `email` (`VARCHAR(255)` UNIQUE NOT NULL): Official login email.
* `password_hash` (`VARCHAR(255)` NOT NULL): Salted HMAC-SHA256 hash.
* `full_name` (`VARCHAR(255)` NOT NULL): Staff legal name.
* `role` (`ENUM('ADMIN', 'MANAGER', 'LEAD_MANAGER')`): RBAC permission tier.
* `is_active` (`BOOLEAN` NOT NULL DEFAULT TRUE): Active account status flag.
* `last_login_at` (`TIMESTAMPTZ`): Timestamp of most recent authenticated session.
* `created_at`, `updated_at` (`TIMESTAMPTZ`): Auditing timestamps.
* **Indexes:** `idx_users_email` (UNIQUE), `idx_users_role`.

### 2.2. `sessions`
Server-side verifiable session tokens supporting instant revocation.
* `id` (`VARCHAR(64)` PK): Session record ID (`ses_...`).
* `token` (`VARCHAR(512)` UNIQUE NOT NULL): Random 256-bit hexadecimal bearer token.
* `user_id` (`VARCHAR(64)` FK -> `users.id` ON DELETE CASCADE).
* `expires_at` (`TIMESTAMPTZ` NOT NULL): Session expiration (24h standard).
* `user_agent` (`TEXT`), `ip_address` (`VARCHAR(45)`): Request context metadata.
* `created_at` (`TIMESTAMPTZ` NOT NULL).
* **Indexes:** `idx_sessions_token`, `idx_sessions_expires_at`.

### 2.3. `site_settings`
Global brand configuration, contact metadata, social links, and legal copy.
* `id` (`VARCHAR(64)` PK): Default `'settings_default'`.
* `brand_name` (`VARCHAR(255)`): "Wanderer's Journeys".
* `slogan` (`VARCHAR(255)`): "Where curiosity leads, possibilities unfold".
* `default_seo_title` (`VARCHAR(255)`), `default_seo_description` (`TEXT`).
* `contact_email` (`VARCHAR(255)`), `notification_email` (`VARCHAR(255)`).
* `contact_phone` (`VARCHAR(64)`), `address` (`TEXT`).
* `social_links` (`JSONB`): `{ facebook, instagram, tiktok }`.
* `footer_note` (`TEXT`), `copyright` (`VARCHAR(255)`).
* `budget_comparison_message` (`TEXT`).

### 2.4. `packages`
The 5 foundational long-term living and exploratory packages.
* `id` (`VARCHAR(64)` PK): Unique ID (`pkg_...`).
* `code` (`VARCHAR(64)` UNIQUE): `PRIVATE_DISCOVERY`, `30_DAY_TRIAL`, `SNOWBIRD_SPECIAL`, `SIX_MONTH_EXPLORATORY`, `RETIREMENT_PACKAGE`.
* `title` (`VARCHAR(255)` NOT NULL): Display package name.
* `tag` (`VARCHAR(100)`): Sub-badge (e.g., 'Winter Seasonal Escape').
* `duration` (`VARCHAR(100)` NOT NULL): Stay duration description.
* `price_range` (`VARCHAR(100)` NOT NULL): Reference cost (e.g. '$2,350 / month').
* `is_custom_quote` (`BOOLEAN`): True if requiring bespoke pricing.
* `summary` (`TEXT`): Overview paragraph.
* `inclusions` (`JSONB`): Array of strings.
* `exclusions` (`JSONB`): Array of strings.
* `ideal_for` (`TEXT`), `conditions` (`TEXT`).
* `image_url` (`TEXT`), `is_featured` (`BOOLEAN`), `is_published` (`BOOLEAN`).
* `display_order` (`INT` DEFAULT 1).

### 2.5. `accommodations`
Curated residential units across Da Nang, Nha Trang, and Ho Chi Minh City.
* `id` (`VARCHAR(64)` PK).
* `title` (`VARCHAR(255)` NOT NULL).
* `city` (`VARCHAR(100)` NOT NULL): 'Da Nang', 'Nha Trang', or 'Ho Chi Minh City'.
* `district` (`VARCHAR(100)` NOT NULL).
* `property_type` (`VARCHAR(100)`): Ocean Villa, Luxury Apartment, Resort Suite, etc.
* `bedrooms` (`INT` DEFAULT 2), `bathrooms` (`INT` DEFAULT 2), `area_sqm` (`INT`).
* `price_month_usd` (`NUMERIC(10,2)`).
* `description` (`TEXT`), `amenities` (`JSONB`), `images` (`JSONB`).
* `is_published` (`BOOLEAN` DEFAULT TRUE), `display_order` (`INT`).
* **Indexes:** `idx_accommodations_city`.

### 2.6. `inquiry_form_fields`
Powers the Dynamic Form Builder for the 15-field visitor questionnaire.
* `id` (`VARCHAR(64)` PK).
* `field_key` (`VARCHAR(64)` UNIQUE NOT NULL).
* `label` (`VARCHAR(255)` NOT NULL).
* `field_type` (`VARCHAR(32)` NOT NULL): `text`, `email`, `tel`, `date`, `select`, `checkbox`, `textarea`, `number`.
* `placeholder` (`VARCHAR(255)`), `help_text` (`TEXT`).
* `is_required` (`BOOLEAN` DEFAULT FALSE), `is_system` (`BOOLEAN` DEFAULT FALSE).
* `is_enabled` (`BOOLEAN` DEFAULT TRUE), `display_order` (`INT`).
* `options` (`JSONB`), `section_group` (`VARCHAR(64)`).

### 2.7. `leads`
Confidential inquiry and proposal intake files.
* `id` (`VARCHAR(64)` PK).
* `lead_code` (`VARCHAR(64)` UNIQUE NOT NULL): Reference code e.g. `WJ-2026-XXXX`.
* `full_name` (`VARCHAR(255)` NOT NULL), `email` (`VARCHAR(255)` NOT NULL), `phone` (`VARCHAR(64)`).
* `country_code` (`VARCHAR(100)`): Country of citizenship.
* `expected_start_date` (`DATE`), `duration` (`VARCHAR(100)`), `guest_count` (`INT`), `age_groups` (`VARCHAR(100)`).
* `package_code` (`VARCHAR(64)`), `package_name` (`VARCHAR(255)`).
* `destination_city` (`VARCHAR(100)`), `preferred_accommodation_type` (`VARCHAR(100)`).
* `activities` (`JSONB`), `transport_preference` (`VARCHAR(100)`), `estimated_budget` (`VARCHAR(100)`).
* `additional_notes` (`TEXT`).
* `consent_accepted` (`BOOLEAN` DEFAULT TRUE).
* `status` (`ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED')` DEFAULT 'NEW').
* `priority` (`ENUM('LOW', 'MEDIUM', 'HIGH')` DEFAULT 'MEDIUM').
* `assigned_to` (`VARCHAR(64)` FK -> `users.id` ON DELETE SET NULL).
* `source` (`VARCHAR(100)` DEFAULT 'Website Inquiry Form').
* `idempotency_key` (`VARCHAR(128)` UNIQUE).
* `created_at`, `updated_at` (`TIMESTAMPTZ` NOT NULL DEFAULT NOW()).
* **Indexes:** `idx_leads_status`, `idx_leads_created_at`, `idx_leads_destination_city`.

### 2.8. `lead_notes`
Internal concierge observations and communication updates (never exposed publicly).
* `id` (`VARCHAR(64)` PK).
* `lead_id` (`VARCHAR(64)` FK -> `leads.id` ON DELETE CASCADE).
* `author_id` (`VARCHAR(64)` FK -> `users.id`), `author_name` (`VARCHAR(255)`).
* `content` (`TEXT` NOT NULL).
* `created_at` (`TIMESTAMPTZ` NOT NULL DEFAULT NOW()).

### 2.9. `lead_status_history`
Chronological audit of every stage transition.
* `id` (`VARCHAR(64)` PK).
* `lead_id` (`VARCHAR(64)` FK -> `leads.id` ON DELETE CASCADE).
* `old_status`, `new_status` (`ENUM(...)`).
* `changed_by_id` (`VARCHAR(64)`), `changed_by_name` (`VARCHAR(255)`).
* `note` (`TEXT`), `changed_at` (`TIMESTAMPTZ` NOT NULL DEFAULT NOW()).

### 2.10. `email_jobs`
Outbox queue decoupled from intake request cycle.
* `id` (`VARCHAR(64)` PK).
* `lead_id` (`VARCHAR(64)` FK -> `leads.id` ON DELETE SET NULL).
* `recipient_email` (`VARCHAR(255)` NOT NULL), `subject` (`VARCHAR(255)` NOT NULL).
* `body_preview` (`TEXT`).
* `status` (`ENUM('QUEUED', 'SENT', 'FAILED')` DEFAULT 'QUEUED').
* `attempts` (`INT` DEFAULT 0), `max_attempts` (`INT` DEFAULT 3).
* `last_error` (`TEXT`), `scheduled_at`, `sent_at` (`TIMESTAMPTZ`).

### 2.11. `audit_logs`
Chronological security audit trail.
* `id` (`VARCHAR(64)` PK).
* `user_id` (`VARCHAR(64)`), `user_email` (`VARCHAR(255)`).
* `action` (`VARCHAR(100)` NOT NULL), `entity_type` (`VARCHAR(100)` NOT NULL), `entity_id` (`VARCHAR(64)`).
* `details` (`TEXT`), `ip_address` (`VARCHAR(45)`), `created_at` (`TIMESTAMPTZ` NOT NULL).
