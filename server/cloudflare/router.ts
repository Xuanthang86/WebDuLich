/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cloudflare Pages Functions & Workers Unified API Router
 * Backed by Cloudflare D1 (SQLite) and Cloudflare R2
 */

export interface Env {
  DB?: any; // Cloudflare D1Database binding
  MEDIA_BUCKET?: any; // Cloudflare R2Bucket binding
  JWT_SECRET?: string;
  CORS_ORIGIN?: string;
  NOTIFICATION_EMAIL?: string;
  RESEND_API_KEY?: string;
  MAILCHANNELS_ENABLED?: string;
}

// Utility: bytes to hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility: hex to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Hash password with Web Crypto PBKDF2
export async function hashWebCryptoPBKDF2(password: string, customSaltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = customSaltHex ? hexToBytes(customSaltHex) : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    512
  );

  const derivedHex = bytesToHex(new Uint8Array(derived));
  return `pbkdf2:${saltHex}:${derivedHex}`;
}

// Verify password with Web Crypto
export async function verifyWebCryptoPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, expectedKeyHex] = parts;
    const computed = await hashWebCryptoPBKDF2(password, saltHex);
    return computed === storedHash;
  }

  // Scrypt compatibility mode (if nodejs_compat crypto is present)
  if (storedHash.startsWith('scrypt:')) {
    try {
      const nodeCrypto = await import('crypto');
      const parts = storedHash.split(':');
      if (parts.length !== 3) return false;
      const [, salt, key] = parts;
      const derived = nodeCrypto.scryptSync(password, salt, 64).toString('hex');
      return derived === key;
    } catch {
      console.warn('Scrypt verification fallback in Workers requires nodejs_compat');
    }
  }

  // Legacy HMAC SHA-256
  try {
    const enc = new TextEncoder();
    const legacySalt = 'wj_secure_salt_2026_vn';
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(legacySalt),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(password));
    const legacyHash = bytesToHex(new Uint8Array(signature));
    return legacyHash === storedHash;
  } catch {
    return false;
  }
}

// Standard CORS response helper
function corsHeaders(env: Env, req: Request): HeadersInit {
  const allowed = env.CORS_ORIGIN || 'https://xuanthang.io.vn';
  const origin = req.headers.get('Origin') || '*';
  const isAllowed = allowed === '*' || allowed.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://xuanthang.io.vn',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: any, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Session authentication from D1
async function getAuthUser(req: Request, env: Env): Promise<{ user: any; token: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token || !env.DB) return null;

  const now = new Date().toISOString();
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > ?'
  ).bind(token, now).first();

  if (!session) return null;

  const user = await env.DB.prepare(
    'SELECT id, email, full_name as fullName, role, is_active as isActive, last_login_at as lastLoginAt, created_at as createdAt FROM users WHERE id = ?'
  ).bind(session.user_id).first();

  if (!user || !user.isActive) return null;

  return { user, token };
}

// Safe parser for JSON fields from SQLite
function parseJson(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Email dispatch helper (MailChannels / Resend)
async function sendNotificationEmail(env: Env, lead: any) {
  const recipient = env.NOTIFICATION_EMAIL || 'info@wanderersjourneys.com';
  const subject = `[New Proposal Request] ${lead.fullName} (${lead.countryCode}) - ${lead.packageName || 'Living Inquiry'}`;
  const textContent = `New inquiry received for Wanderer's Journeys!\n\nGuest: ${lead.fullName}\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nCountry: ${lead.countryCode}\nPackage: ${lead.packageName || 'Bespoke'}\nCity: ${lead.destinationCity || 'Any'}\nLead Code: ${lead.leadCode}\n`;

  // 1. Try Resend if API key is provided
  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Wanderers Journeys <concierge@xuanthang.io.vn>',
          to: [recipient],
          subject,
          text: textContent,
        }),
      });
      return { status: 'SENT' };
    } catch (e: any) {
      console.error('Resend delivery failed:', e);
    }
  }

  // 2. Try Cloudflare Workers free MailChannels API
  if (env.MAILCHANNELS_ENABLED !== 'false') {
    try {
      const resp = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient, name: 'Concierge Desk' }] }],
          from: { email: 'noreply@xuanthang.io.vn', name: "Wanderer's Journeys" },
          subject,
          content: [{ type: 'text/plain', value: textContent }],
        }),
      });
      if (resp.ok) return { status: 'SENT' };
    } catch (e) {
      console.warn('MailChannels dispatch note:', e);
    }
  }

  return { status: 'SIMULATED', note: 'Email logged in queue. Configure RESEND_API_KEY for production delivery.' };
}

/**
 * Main Cloudflare Request Handler for /api/*
 */
export async function handleCloudflareApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const cors = corsHeaders(env, request);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    // ----------------------------------------------------
    // 1. HEALTH CHECK
    // ----------------------------------------------------
    if (path === '/api/health' || path === '/api/public/health') {
      return jsonResponse(
        {
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          runtime: 'Cloudflare Edge',
          database: env.DB ? 'Connected (D1)' : 'Unbound',
          storage: env.MEDIA_BUCKET ? 'Connected (R2)' : 'Unbound',
        },
        200,
        cors
      );
    }

    // ----------------------------------------------------
    // 2. PUBLIC BUNDLE: /api/public/content
    // ----------------------------------------------------
    if (path === '/api/public/content' && method === 'GET') {
      if (!env.DB) {
        return jsonResponse({ success: false, error: { message: 'Database binding (DB) not found in Worker environment.' } }, 500, cors);
      }

      const settings = (await env.DB.prepare('SELECT * FROM site_settings LIMIT 1').first()) || {};
      const hero = (await env.DB.prepare('SELECT * FROM hero_content LIMIT 1').first()) || {};
      const whyVietnam = (await env.DB.prepare('SELECT * FROM why_vietnam WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];
      const whyChooseUs = (await env.DB.prepare('SELECT * FROM why_choose_us WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];
      const coreService = (await env.DB.prepare('SELECT * FROM core_services WHERE is_published = 1 LIMIT 1').first()) || {};
      const additionalServices = (await env.DB.prepare('SELECT * FROM additional_services WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];
      const packages = (await env.DB.prepare('SELECT * FROM packages WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];
      const accommodations = (await env.DB.prepare('SELECT * FROM accommodations WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];
      const faqs = (await env.DB.prepare('SELECT * FROM faqs WHERE is_published = 1 ORDER BY display_order ASC').all()).results || [];

      return jsonResponse(
        {
          success: true,
          data: {
            settings: {
              brandName: settings.brand_name,
              slogan: settings.slogan,
              defaultSeoTitle: settings.default_seo_title,
              defaultSeoDescription: settings.default_seo_description,
              contactEmail: settings.contact_email,
              contactPhone: settings.contact_phone,
              address: settings.address,
              socialLinks: parseJson(settings.social_links, {}),
              footerNote: settings.footer_note,
              copyright: settings.copyright,
              budgetComparisonMessage: settings.budget_comparison_message,
            },
            hero: {
              headline: hero.headline,
              tagline: hero.tagline,
              subtext: hero.subtext,
              primaryCtaText: hero.primary_cta_text,
              secondaryCtaText: hero.secondary_cta_text,
              badgeText: hero.badge_text,
              backgroundImageUrl: hero.background_image_url,
              stats: parseJson(hero.stats, []),
            },
            whyVietnam: whyVietnam.map((w: any) => ({
              id: w.id,
              title: w.title,
              subtitle: w.subtitle,
              description: w.description,
              highlights: parseJson(w.highlights, []),
              icon: w.icon,
            })),
            whyChooseUs: whyChooseUs.map((c: any) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              icon: c.icon,
            })),
            coreService: {
              id: coreService.id,
              title: coreService.title,
              monthlyStartingPrice: coreService.monthly_starting_price,
              description: coreService.description,
              utilityAllowanceNote: coreService.utility_allowance_note,
              resortAmenities: parseJson(coreService.resort_amenities, []),
              personalAssistant: coreService.personal_assistant,
              cleaningSchedule: coreService.cleaning_schedule,
              internetSpeed: coreService.internet_speed,
              visaSupportNote: coreService.visa_support_note,
              healthInsuranceSupportNote: coreService.health_insurance_support_note,
              bankingSupportNote: coreService.banking_support_note,
            },
            additionalServices: additionalServices.map((a: any) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              priceLabel: a.price_label,
              category: a.category,
              icon: a.icon,
              conditions: a.conditions,
            })),
            packages: packages.map((p: any) => ({
              id: p.id,
              packageCode: p.package_code,
              title: p.title,
              durationLabel: p.duration_label,
              durationCategory: p.duration_category,
              targetAudience: p.target_audience,
              startingPriceUsd: p.starting_price_usd,
              description: p.description,
              idealFor: parseJson(p.ideal_for, []),
              inclusions: parseJson(p.inclusions, []),
            })),
            accommodations: accommodations.map((acc: any) => ({
              id: acc.id,
              title: acc.title,
              city: acc.city,
              district: acc.district,
              neighborhood: acc.neighborhood,
              roomType: acc.room_type,
              sizeSqm: acc.size_sqm,
              bedrooms: acc.bedrooms,
              bathrooms: acc.bathrooms,
              priceMonthUsd: acc.price_month_usd,
              description: acc.description,
              features: parseJson(acc.features, []),
              nearbyAmenities: parseJson(acc.nearby_amenities, []),
              images: parseJson(acc.images, []),
              isFlagship: Boolean(acc.is_flagship),
              displayOrder: acc.display_order,
            })),
            faqs: faqs.map((f: any) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              category: f.category,
              displayOrder: f.display_order,
            })),
          },
        },
        200,
        cors
      );
    }

    // ----------------------------------------------------
    // 3. FORM FIELDS: /api/public/form-fields
    // ----------------------------------------------------
    if (path === '/api/public/form-fields' && method === 'GET') {
      const rows = (await env.DB.prepare('SELECT * FROM form_fields WHERE is_enabled = 1 ORDER BY display_order ASC').all()).results || [];
      const fields = rows.map((r: any) => ({
        id: r.id,
        fieldName: r.field_name,
        label: r.label,
        fieldType: r.field_type,
        isRequired: Boolean(r.is_required),
        isEnabled: Boolean(r.is_enabled),
        placeholder: r.placeholder,
        options: parseJson(r.options, []),
        displayOrder: r.display_order,
        validationRule: r.validation_rule,
      }));
      return jsonResponse({ success: true, data: fields }, 200, cors);
    }

    // ----------------------------------------------------
    // 4. SUBMIT INQUIRY: /api/public/inquiry
    // ----------------------------------------------------
    if (path === '/api/public/inquiry' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        fullName,
        email,
        phone,
        countryCode,
        expectedStartDate,
        duration,
        guestCount,
        ageGroups,
        packageCode,
        packageName,
        destinationCity,
        preferredAccommodationType,
        activities,
        transportPreference,
        estimatedBudget,
        additionalNotes,
        consentAccepted,
        honeypot,
      } = body as any;

      // Honeypot anti-bot check
      if (honeypot && String(honeypot).trim().length > 0) {
        return jsonResponse({ success: true, data: { leadCode: 'WJ-2026-BOT-DEFLECTED', message: 'Inquiry received.' } }, 200, cors);
      }

      if (!fullName || !email) {
        return jsonResponse({ success: false, error: { message: 'Full name and email are required.' } }, 400, cors);
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const leadCode = `WJ-${new Date().getFullYear()}-${randomSuffix}`;
      const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO leads (
          id, lead_code, full_name, email, phone, country_code,
          expected_start_date, duration, guest_count, age_groups,
          package_code, package_name, destination_city, preferred_accommodation_type,
          activities, transport_preference, estimated_budget, additional_notes,
          consent_accepted, status, priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', 'MEDIUM', ?, ?)
      `).bind(
        id, leadCode, fullName.trim(), email.trim(), phone || '', countryCode || 'US',
        expectedStartDate || '', duration || '', guestCount || 1, JSON.stringify(ageGroups || []),
        packageCode || '', packageName || '', destinationCity || '', preferredAccommodationType || '',
        JSON.stringify(activities || []), transportPreference || '', estimatedBudget || '', additionalNotes || '',
        consentAccepted ? 1 : 0, now, now
      ).run();

      // Initial history
      await env.DB.prepare(`
        INSERT INTO lead_status_history (id, lead_id, old_status, new_status, changed_by_id, changed_by_name, note, changed_at)
        VALUES (?, ?, 'NEW', 'NEW', 'SYSTEM', 'System Intake', 'Inquiry received via web questionnaire.', ?)
      `).bind(`lsh_${Date.now()}`, id, now).run();

      // Trigger email dispatch in background
      sendNotificationEmail(env, { id, leadCode, fullName, email, phone, countryCode, packageName, destinationCity });

      return jsonResponse({ success: true, data: { leadCode, message: 'Inquiry received successfully.' } }, 200, cors);
    }

    // ----------------------------------------------------
    // 5. AUTH: LOGIN (/api/auth/login)
    // ----------------------------------------------------
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { email, password } = body as any;

      if (!email || !password) {
        return jsonResponse({ success: false, error: { message: 'Email and password are required.' } }, 400, cors);
      }

      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)'
      ).bind(email.trim()).first();

      if (!user) {
        return jsonResponse({ success: false, error: { message: 'Invalid email or password.' } }, 401, cors);
      }

      if (!user.is_active) {
        return jsonResponse({ success: false, error: { message: 'This account has been deactivated.' } }, 403, cors);
      }

      const isMatch = await verifyWebCryptoPassword(password, user.password_hash);
      if (!isMatch) {
        // Record failed audit log
        await env.DB.prepare(`
          INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, ip_address, created_at)
          VALUES (?, ?, ?, 'LOGIN_FAILED', 'AUTH', 'Incorrect password attempt.', ?, datetime('now'))
        `).bind(`aud_${Date.now()}`, user.id, user.email, request.headers.get('cf-connecting-ip') || 'edge').run();

        return jsonResponse({ success: false, error: { message: 'Invalid email or password.' } }, 401, cors);
      }

      // Upgrade hash to Web Crypto PBKDF2 if needed
      if (!user.password_hash.startsWith('pbkdf2:')) {
        const newHash = await hashWebCryptoPBKDF2(password);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
      }

      // Create session
      const token = bytesToHex(crypto.getRandomValues(new Uint8Array(24)));
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const sessionId = `ses_${Date.now()}_${bytesToHex(crypto.getRandomValues(new Uint8Array(4)))}`;

      await env.DB.prepare(`
        INSERT INTO sessions (id, token, user_id, expires_at, user_agent, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        sessionId,
        token,
        user.id,
        expiresAt,
        request.headers.get('user-agent') || 'edge',
        request.headers.get('cf-connecting-ip') || 'edge'
      ).run();

      await env.DB.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').bind(user.id).run();

      // Record successful audit log
      await env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, ip_address, created_at)
        VALUES (?, ?, ?, 'LOGIN_SUCCESS', 'AUTH', ?, ?, datetime('now'))
      `).bind(
        `aud_${Date.now()}`,
        user.id,
        user.email,
        `Logged in with role ${user.role}.`,
        request.headers.get('cf-connecting-ip') || 'edge'
      ).run();

      return jsonResponse({
        success: true,
        data: {
          token,
          expiresAt,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          },
        },
      }, 200, cors);
    }

    // ----------------------------------------------------
    // AUTHENTICATED ROUTES VERIFICATION
    // ----------------------------------------------------
    const authSession = await getAuthUser(request, env);

    // ----------------------------------------------------
    // 6. AUTH: ME (/api/auth/me)
    // ----------------------------------------------------
    if (path === '/api/auth/me' && method === 'GET') {
      if (!authSession) {
        return jsonResponse({ success: false, error: { message: 'Unauthorized or session expired.' } }, 401, cors);
      }
      return jsonResponse({ success: true, data: { user: authSession.user } }, 200, cors);
    }

    // ----------------------------------------------------
    // 7. AUTH: PROFILE UPDATE (/api/auth/profile)
    // ----------------------------------------------------
    if (path === '/api/auth/profile' && method === 'PUT') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const { fullName } = (await request.json().catch(() => ({}))) as any;
      if (!fullName) return jsonResponse({ success: false, error: { message: 'Full name required' } }, 400, cors);

      await env.DB.prepare('UPDATE users SET full_name = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(fullName.trim(), authSession.user.id).run();

      return jsonResponse({ success: true, data: { ...authSession.user, fullName } }, 200, cors);
    }

    // ----------------------------------------------------
    // 8. AUTH: CHANGE PASSWORD (/api/auth/change-password)
    // ----------------------------------------------------
    if (path === '/api/auth/change-password' && method === 'PUT') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const { currentPassword, newPassword } = (await request.json().catch(() => ({}))) as any;

      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return jsonResponse({ success: false, error: { message: 'Password must be at least 8 characters.' } }, 400, cors);
      }

      const currentUser = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
        .bind(authSession.user.id).first();

      const isMatch = await verifyWebCryptoPassword(currentPassword, currentUser.password_hash);
      if (!isMatch) {
        return jsonResponse({ success: false, error: { message: 'Current password is incorrect.' } }, 400, cors);
      }

      const newHash = await hashWebCryptoPBKDF2(newPassword);
      await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(newHash, authSession.user.id).run();

      // Revoke other sessions
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?')
        .bind(authSession.user.id, authSession.token).run();

      return jsonResponse({ success: true, message: 'Password changed successfully.' }, 200, cors);
    }

    // ----------------------------------------------------
    // 9. ADMIN: USERS MANAGEMENT (RBAC: ADMIN only)
    // ----------------------------------------------------
    if (path === '/api/auth/users' && method === 'GET') {
      if (!authSession || authSession.user.role !== 'ADMIN') {
        return jsonResponse({ success: false, error: { message: 'Admin access required.' } }, 403, cors);
      }
      const users = (await env.DB.prepare(
        'SELECT id, email, full_name as fullName, role, is_active as isActive, last_login_at as lastLoginAt, created_at as createdAt FROM users'
      ).all()).results || [];
      return jsonResponse({ success: true, data: users }, 200, cors);
    }

    if (path === '/api/auth/users' && method === 'POST') {
      if (!authSession || authSession.user.role !== 'ADMIN') {
        return jsonResponse({ success: false, error: { message: 'Admin access required.' } }, 403, cors);
      }
      const { email, password, fullName, role } = (await request.json().catch(() => ({}))) as any;
      if (!email || !password || !fullName || !role) {
        return jsonResponse({ success: false, error: { message: 'All fields are required.' } }, 400, cors);
      }

      const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').bind(email.trim()).first();
      if (existing) {
        return jsonResponse({ success: false, error: { message: 'Email already exists.' } }, 400, cors);
      }

      const id = `usr_${Date.now()}`;
      const hash = await hashWebCryptoPBKDF2(password);
      await env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(id, email.trim(), hash, fullName.trim(), role).run();

      return jsonResponse({ success: true, data: { id, email, fullName, role, isActive: true } }, 200, cors);
    }

    // ----------------------------------------------------
    // 10. ADMIN: DASHBOARD ANALYTICS (/api/admin/analytics)
    // ----------------------------------------------------
    if (path === '/api/admin/analytics' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);

      const leads = (await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()).results || [];
      const total = leads.length;
      const newCount = leads.filter((l: any) => l.status === 'NEW').length;
      const contactedCount = leads.filter((l: any) => l.status === 'CONTACTED').length;
      const qualifiedCount = leads.filter((l: any) => l.status === 'QUALIFIED').length;
      const convertedCount = leads.filter((l: any) => l.status === 'CONVERTED').length;
      const closedCount = leads.filter((l: any) => l.status === 'CLOSED').length;
      const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : '0.0';

      const packageMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        const k = l.package_name || l.package_code || 'Other';
        packageMap[k] = (packageMap[k] || 0) + 1;
      });

      const cityMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        const k = l.destination_city || 'Other';
        cityMap[k] = (cityMap[k] || 0) + 1;
      });

      return jsonResponse({
        success: true,
        data: {
          metrics: {
            totalLeads: total,
            newLeads: newCount,
            contactedLeads: contactedCount,
            qualifiedLeads: qualifiedCount,
            convertedLeads: convertedCount,
            closedLeads: closedCount,
            conversionRatePercent: conversionRate,
          },
          packageDistribution: packageMap,
          cityDistribution: cityMap,
          countryDistribution: {},
          recentLeads: leads.slice(0, 5).map((l: any) => ({
            id: l.id,
            leadCode: l.lead_code,
            fullName: l.full_name,
            email: l.email,
            phone: l.phone,
            countryCode: l.country_code,
            packageName: l.package_name,
            destinationCity: l.destination_city,
            status: l.status,
            priority: l.priority,
            createdAt: l.created_at,
          })),
        },
      }, 200, cors);
    }

    // ----------------------------------------------------
    // 11. ADMIN: LEADS LIST (/api/admin/leads)
    // ----------------------------------------------------
    if (path === '/api/admin/leads' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leads = (await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()).results || [];
      const mapped = leads.map((l: any) => ({
        id: l.id,
        leadCode: l.lead_code,
        fullName: l.full_name,
        email: l.email,
        phone: l.phone,
        countryCode: l.country_code,
        expectedStartDate: l.expected_start_date,
        duration: l.duration,
        guestCount: l.guest_count,
        ageGroups: parseJson(l.age_groups, []),
        packageCode: l.package_code,
        packageName: l.package_name,
        destinationCity: l.destination_city,
        preferredAccommodationType: l.preferred_accommodation_type,
        activities: parseJson(l.activities, []),
        transportPreference: l.transport_preference,
        estimatedBudget: l.estimated_budget,
        additionalNotes: l.additional_notes,
        status: l.status,
        priority: l.priority,
        assignedTo: l.assigned_to,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      }));
      return jsonResponse({ success: true, data: mapped }, 200, cors);
    }

    // ----------------------------------------------------
    // 12. ADMIN: AUDIT LOGS (/api/admin/audit-logs)
    // ----------------------------------------------------
    if (path === '/api/admin/audit-logs' && method === 'GET') {
      if (!authSession || authSession.user.role !== 'ADMIN') {
        return jsonResponse({ success: false, error: { message: 'Admin access required.' } }, 403, cors);
      }
      const logs = (await env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all()).results || [];
      return jsonResponse({
        success: true,
        data: logs.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          userEmail: log.user_email,
          action: log.action,
          entityType: log.entity_type,
          entityId: log.entity_id,
          details: log.details,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
      }, 200, cors);
    }

    // ----------------------------------------------------
    // 13. ADMIN: MEDIA ASSETS (R2 storage)
    // ----------------------------------------------------
    if (path === '/api/admin/media' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const media = (await env.DB.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all()).results || [];
      return jsonResponse({ success: true, data: media }, 200, cors);
    }

    if (path === '/api/admin/media/upload' && method === 'POST') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (!env.MEDIA_BUCKET) {
        return jsonResponse({ success: false, error: { message: 'Cloudflare R2 bucket (MEDIA_BUCKET) not bound.' } }, 500, cors);
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) return jsonResponse({ success: false, error: { message: 'No file provided' } }, 400, cors);

      const fileExt = file.name.split('.').pop() || 'jpg';
      const key = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      await env.MEDIA_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      const publicUrl = `https://xuanthang.io.vn/media/${key}`;
      const assetId = `med_${Date.now()}`;

      await env.DB.prepare(`
        INSERT INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_text, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'general', datetime('now'))
      `).bind(assetId, key, file.name, file.type, file.size, publicUrl, file.name).run();

      return jsonResponse({ success: true, data: { id: assetId, url: publicUrl, filename: key } }, 200, cors);
    }

    // Default 404 for unrecognized API endpoints
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Endpoint ${method} ${path} is not found on Cloudflare API.`,
        },
      },
      404,
      cors
    );
  } catch (err: any) {
    console.error('Cloudflare Worker API Error:', err);
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err?.message || 'Internal Cloudflare edge error.',
        },
      },
      500,
      cors
    );
  }
}
