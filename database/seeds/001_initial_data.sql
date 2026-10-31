-- ====================================================================
-- Wanderer's Journeys - Seed Data SQL
-- Seeds: 001_initial_data.sql
-- Description: Baseline administrator, default settings, catalog and form
-- ====================================================================

-- 1. USERS & ADMINISTRATORS
-- SECURITY ENFORCEMENT: Never commit sample passwords or administrator accounts to seed files.
-- Initial Super Administrator MUST be bootstrapped using:
--   npx tsx scripts/bootstrap_admin.ts --email="admin@yourdomain.com" --password="YourSecurePassword"
-- Or via POST /api/auth/bootstrap with the configured administrative SETUP_SECRET.

-- 2. SEED SITE SETTINGS
INSERT INTO site_settings (id, brand_name, slogan, default_seo_title, default_seo_description, contact_email, notification_email, contact_phone, address, social_links, footer_note, copyright, budget_comparison_message)
VALUES (
    'settings_default',
    'Wanderer''s Journeys',
    'Where curiosity leads, possibilities unfold',
    'Wanderer''s Journeys | Live Freely, Retire Happily in Vietnam',
    'Turnkey luxury retirement living, seasonal escapes, and exploratory stays in Da Nang, Nha Trang, and Ho Chi Minh City.',
    'info@wanderersjourneys.com',
    'info@wanderersjourneys.com',
    '+84 (0) 28 3822 5588',
    'Level 18, Saigon Centre Tower 2, 67 Le Loi, District 1, Ho Chi Minh City, Vietnam',
    '{"facebook":"https://facebook.com/wanderersjourneys","instagram":"https://instagram.com/wanderersjourneys","tiktok":"https://tiktok.com/@wanderersjourneys"}'::jsonb,
    'Wanderer’s Journeys provides premium hospitality, lifestyle curation, and residential advisory for international seniors and explorers in Vietnam. Independent legal, visa, and financial services are facilitated through accredited licensed partners.',
    '© 2026 Wanderer’s Journeys Hospitality Ltd. All rights reserved.',
    'Experience premier coastal resort living, daily wellness, and dedicated concierge care in Vietnam for $40,000/year with a standard of living rivaling $90,000+ in North America or Western Europe.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED PACKAGES
INSERT INTO packages (id, code, title, tag, duration, price_range, is_custom_quote, summary, inclusions, exclusions, ideal_for, conditions, image_url, is_featured, display_order)
VALUES
(
    'pkg_discovery',
    'PRIVATE_DISCOVERY',
    'Private Discovery Tour',
    'Short-Term Exploration',
    '7 - 14 Days',
    'Custom Itinerary / From $1,800',
    true,
    'An intensive, luxurious introduction to retirement life in Vietnam. Visit premier residential communities, inspect hospitals, taste local dining, and meet active Western retirees.',
    '["Luxury 5-star or serviced apartment accommodation","Private airport VIP greeting and dedicated chauffeur","Full escorted neighborhood, facility, and clinic walkthroughs","One-on-one consultation with visa & living cost advisors","Hosted dinners with active expat community leaders"]'::jsonb,
    '["International airfare","Personal leisure shopping"]'::jsonb,
    'Explorers who want a firsthand test drive before committing to a longer stay.',
    'Customizable dates year-round. Advance booking recommended.',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    false,
    1
),
(
    'pkg_trial30',
    '30_DAY_TRIAL',
    '30-Day Living Trial',
    'Immersive One-Month Stay',
    '30 Days',
    '$2,450 / month (all-inclusive)',
    false,
    'Spend a full month living like a local with zero lease commitments. Unwind in a turnkey beachfront apartment with housekeeping, concierge support, and community events.',
    '["Fully furnished 2-bedroom executive residence","Housekeeping 3x weekly with fresh linens","Dedicated Personal Navigator for local orientation","High-speed 100 Mbps internet & utilities allowance ($150)","Clubhouse, fitness center, and swimming pool privileges","Invitations to weekly expat social dinners & excursions"]'::jsonb,
    '["Health insurance policy costs","Personal dining and transport"]'::jsonb,
    'Seniors taking an extended sabbatical or evaluating Vietnam for retirement.',
    'Available in Da Nang, Nha Trang, and Ho Chi Minh City.',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    true,
    2
),
(
    'pkg_snowbird',
    'SNOWBIRD_SPECIAL',
    'Snowbird Special',
    'Winter Seasonal Escape',
    '30 - 90 Days (Nov - April)',
    'From $2,350 / month',
    false,
    'Escape freezing North American and European winters. Bask in mild tropical weather, seaside morning walks, fresh cuisine, and coastal warmth with fellow seasonal residents.',
    '["Ocean-view 2-bedroom or luxury garden residence","Complete utility credit ($150/mo) and fiber Wi-Fi","Housekeeping 3x weekly & bi-weekly laundry service","Local healthcare clinic registration & emergency on-call","Seasonal golf league & wellness club passes"]'::jsonb,
    '["International medical insurance","Flight travel"]'::jsonb,
    'Retirees who keep a summer home in the West and winter in the tropics.',
    'Flexible check-in between October and March.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    false,
    3
),
(
    'pkg_exploratory6',
    'SIX_MONTH_EXPLORATORY',
    'Six-Month Exploratory Stay',
    'Deep Cultural Immersion',
    '6 Months',
    '$2,250 / month',
    false,
    'Establish a semi-permanent rhythm. Option to split your residency between 3 months in coastal Da Nang and 3 months in vibrant Ho Chi Minh City or Nha Trang.',
    '["Turnkey 2-bedroom master suite in premier WRC community","Inter-city transfer assistance between Wanderer’s hubs","Dedicated assistant for personal banking and residency documentation","Comprehensive maintenance, security, and housekeeping","Complimentary weekly conversational Vietnamese lessons"]'::jsonb,
    '["Food & beverage expenses","Personal travel beyond hubs"]'::jsonb,
    'Independent retirees ready for a substantial international chapter.',
    '30-day notice for inter-city hub migration.',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    false,
    4
),
(
    'pkg_retirement12',
    'RETIREMENT_PACKAGE',
    'Full Retirement Package',
    'Annual Complete Living (12 Months)',
    '12 Months (Renewable)',
    '$2,150 / month (Best Value)',
    false,
    'The ultimate peace of mind. Total residential stewardship, premier community integration, ongoing visa administration, and full concierge support year-round.',
    '["Prime residential residence with guaranteed price protection","Full 24/7 bilingual concierge & on-call health emergency response","Regular preventative health wellness checkups with partner clinic","Housekeeping 3x weekly, deep cleaning quarterly, laundry assistance","VIP access to all Wanderer’s clubhouse amenities & social events","Annual visa renewal coordination and local government registration"]'::jsonb,
    '["Personal prescription medication","Specialized private therapies"]'::jsonb,
    'Expats seeking worry-free, long-term tropical retirement in luxury.',
    'Annual commitment with convenient quarterly billing.',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    true,
    5
)
ON CONFLICT (code) DO NOTHING;
