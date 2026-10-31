/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cloudflare Pages Functions & Workers Unified API Router
 * Fully backed by Cloudflare D1 (SQLite) and Cloudflare R2
 * No filesystem or db.json dependency in edge production runtime.
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

// Hash password with Web Crypto PBKDF2 (100,000 iterations SHA-256)
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
    const [, saltHex] = parts;
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
  const allowed = env.CORS_ORIGIN || 'https://xuanthang.io.vn,https://www.xuanthang.io.vn';
  const origin = req.headers.get('Origin') || '*';
  const isAllowed = allowed === '*' || allowed.split(',').map(s => s.trim()).includes(origin);

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
  let token: string | null = null;
  const authHeader = req.headers.get('Authorization');
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  } else if (req.headers.get('x-auth-token')) {
    token = req.headers.get('x-auth-token')?.trim() || null;
  } else {
    try {
      const url = new URL(req.url);
      const qToken = url.searchParams.get('token');
      if (qToken) token = qToken.trim();
    } catch {
      // ignore
    }
  }

  if (!token) {
    const cookieHeader = req.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)wj_session=([^;]+)/);
      if (match) token = match[1];
    }
  }

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

// Anti-formula injection sanitizer for CSV exports (CWE-1236)
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
 * Main Cloudflare Request Handler for /api/* and /media/*
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

  // Direct public media streaming from R2
  if ((path.startsWith('/media/') || path.startsWith('/api/public/media/')) && method === 'GET') {
    const key = path.replace(/^\/api\/public\/media\//, '').replace(/^\/media\//, '');
    if (env.MEDIA_BUCKET && key) {
      const object = await env.MEDIA_BUCKET.get(key);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
    }
    return new Response('Media asset not found in R2.', { status: 404, headers: cors });
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
          runtime: 'Cloudflare Pages / Workers Edge',
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
        _hp_website_trap,
      } = body as any;

      // Honeypot anti-bot check
      if (_hp_website_trap && String(_hp_website_trap).trim().length > 0) {
        return jsonResponse({ success: true, data: { leadCode: 'WJ-2026-BOT', message: 'Inquiry received.' } }, 200, cors);
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

      // Enqueue and trigger email notification
      const emailJobId = `emj_${Date.now()}`;
      await env.DB.prepare(`
        INSERT INTO email_jobs (id, lead_id, recipient_email, subject, body_preview, status, scheduled_at)
        VALUES (?, ?, ?, ?, ?, 'QUEUED', ?)
      `).bind(
        emailJobId, id, env.NOTIFICATION_EMAIL || 'info@wanderersjourneys.com',
        `[New Proposal Request] ${fullName} (${countryCode})`,
        `Lead: ${fullName} - ${packageName || 'Inquiry'}`,
        now
      ).run();

      sendNotificationEmail(env, { id, leadCode, fullName, email, phone, countryCode, packageName, destinationCity });

      return jsonResponse({ success: true, data: { leadCode, message: 'Inquiry received successfully.' } }, 201, cors);
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

      const responseHeaders = new Headers(cors);
      responseHeaders.set(
        'Set-Cookie',
        `wj_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`
      );

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
      }, 200, responseHeaders);
    }

    // ----------------------------------------------------
    // AUTHENTICATED VERIFICATION FOR PROTECTED ROUTES
    // ----------------------------------------------------
    const authSession = await getAuthUser(request, env);

    // ----------------------------------------------------
    // 6. AUTH: ME & LOGOUT
    // ----------------------------------------------------
    if (path === '/api/auth/me' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized or session expired.' } }, 401, cors);
      return jsonResponse({ success: true, data: { user: authSession.user } }, 200, cors);
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      if (authSession) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(authSession.token).run();
      }
      const responseHeaders = new Headers(cors);
      responseHeaders.set('Set-Cookie', 'wj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');
      return jsonResponse({ success: true, message: 'Logged out successfully.' }, 200, responseHeaders);
    }

    // ----------------------------------------------------
    // 7. AUTH: PROFILE & PASSWORD
    // ----------------------------------------------------
    if (path === '/api/auth/profile' && method === 'PUT') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const { fullName } = (await request.json().catch(() => ({}))) as any;
      if (!fullName) return jsonResponse({ success: false, error: { message: 'Full name required' } }, 400, cors);

      await env.DB.prepare('UPDATE users SET full_name = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(fullName.trim(), authSession.user.id).run();

      return jsonResponse({ success: true, data: { ...authSession.user, fullName } }, 200, cors);
    }

    if ((path === '/api/auth/change-password' || path === '/api/auth/password') && (method === 'PUT' || method === 'POST')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const { currentPassword, newPassword } = (await request.json().catch(() => ({}))) as any;

      if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return jsonResponse({ success: false, error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters long.' } }, 400, cors);
      }

      if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return jsonResponse({ success: false, error: { code: 'WEAK_PASSWORD', message: 'New password must contain at least one letter and one number.' } }, 400, cors);
      }

      if (currentPassword === newPassword) {
        return jsonResponse({ success: false, error: { code: 'SAME_PASSWORD', message: 'New password must be different from current password.' } }, 400, cors);
      }

      const currentUser = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
        .bind(authSession.user.id).first();

      const isMatch = await verifyWebCryptoPassword(currentPassword, currentUser.password_hash);
      if (!isMatch) {
        return jsonResponse({ success: false, error: { code: 'INCORRECT_CURRENT_PASSWORD', message: 'Current password is incorrect.' } }, 401, cors);
      }

      const newHash = await hashWebCryptoPBKDF2(newPassword);
      await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(newHash, authSession.user.id).run();

      // Revoke ALL sessions for this user across all devices for security
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(authSession.user.id).run();

      await env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, ip_address, created_at)
        VALUES (?, ?, ?, 'PASSWORD_CHANGED', 'USER', 'User updated password and revoked all active sessions across all devices.', ?, datetime('now'))
      `).bind(
        `aud_${Date.now()}`,
        authSession.user.id,
        authSession.user.email,
        request.headers.get('cf-connecting-ip') || 'edge'
      ).run();

      const responseHeaders = new Headers(cors);
      responseHeaders.set('Set-Cookie', 'wj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure');

      return jsonResponse({
        success: true,
        message: 'Password changed successfully. All active sessions have been revoked. Please log in with your new password.',
        requireRelogin: true,
      }, 200, responseHeaders);
    }

    // ----------------------------------------------------
    // 8. ADMIN: USERS (RBAC: ADMIN ONLY)
    // ----------------------------------------------------
    if (path === '/api/auth/users' && method === 'GET') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
      const users = (await env.DB.prepare(
        'SELECT id, email, full_name as fullName, role, is_active as isActive, last_login_at as lastLoginAt, created_at as createdAt FROM users'
      ).all()).results || [];
      return jsonResponse({ success: true, data: users }, 200, cors);
    }

    if (path === '/api/auth/users' && method === 'POST') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
      const { email, password, fullName, role } = (await request.json().catch(() => ({}))) as any;
      if (!email || !password || !fullName || !role) {
        return jsonResponse({ success: false, error: { message: 'All fields required.' } }, 400, cors);
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

    if (path.startsWith('/api/auth/users/') && path.endsWith('/status') && method === 'PUT') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
      const userId = path.split('/')[4];
      const { isActive } = (await request.json().catch(() => ({}))) as any;

      if (userId === authSession.user.id) {
        return jsonResponse({ success: false, error: { message: 'Cannot deactivate your own account.' } }, 400, cors);
      }

      await env.DB.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(isActive ? 1 : 0, userId).run();

      if (!isActive) {
        await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
      }

      return jsonResponse({ success: true, data: { id: userId, isActive: Boolean(isActive) } }, 200, cors);
    }

    if (path.startsWith('/api/auth/users/') && path.endsWith('/reset-password') && method === 'POST') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
      const userId = path.split('/')[4];
      const { newPassword } = (await request.json().catch(() => ({}))) as any;

      if (userId === authSession.user.id) {
        return jsonResponse({
          success: false,
          error: {
            code: 'SELF_RESET_PROHIBITED',
            message: 'Please update your own password through the Account Profile Change Password section with current password verification.',
          },
        }, 400, cors);
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return jsonResponse({ success: false, error: { message: 'New password must be at least 8 characters long.' } }, 400, cors);
      }

      const targetUser = await env.DB.prepare('SELECT id, role, full_name as fullName, email FROM users WHERE id = ?').bind(userId).first();
      if (!targetUser) {
        return jsonResponse({ success: false, error: { message: 'Staff user not found.' } }, 404, cors);
      }

      if (targetUser.role === 'ADMIN') {
        return jsonResponse({
          success: false,
          error: {
            code: 'PROTECTED_ADMIN_ACCOUNT',
            message: 'Administrator accounts cannot be reset via the staff directory. The administrator must log in and change their password with current password verification.',
          },
        }, 403, cors);
      }

      const hash = await hashWebCryptoPBKDF2(newPassword);
      await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(hash, userId).run();

      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

      await env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, ip_address, created_at)
        VALUES (?, ?, ?, 'USER_PASSWORD_RESET', 'USER', ?, ?, datetime('now'))
      `).bind(
        `aud_${Date.now()}`,
        authSession.user.id,
        authSession.user.email,
        `Admin reset password for staff member ${targetUser.fullName} (${targetUser.email}).`,
        request.headers.get('cf-connecting-ip') || 'edge'
      ).run();

      return jsonResponse({ success: true, message: `Password reset successfully for ${targetUser.fullName}. All active sessions have been revoked.` }, 200, cors);
    }

    // Delete user account (ADMIN role required)
    if (path.startsWith('/api/auth/users/') && !path.includes('/status') && !path.includes('/reset-password') && method === 'DELETE') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
      const userId = path.split('/')[4];

      if (userId === authSession.user.id) {
        return jsonResponse({
          success: false,
          error: {
            code: 'SELF_DELETION_PROHIBITED',
            message: 'Security Violation: You cannot delete your currently authenticated account.',
          },
        }, 400, cors);
      }

      const targetUser = await env.DB.prepare('SELECT id, role, full_name as fullName, email FROM users WHERE id = ?').bind(userId).first();
      if (!targetUser) {
        return jsonResponse({ success: false, error: { message: 'User account not found.' } }, 404, cors);
      }

      if (targetUser.role === 'ADMIN') {
        const activeAdmins = (await env.DB.prepare('SELECT id FROM users WHERE role = "ADMIN" AND is_active = 1').all()).results || [];
        if (activeAdmins.length <= 1) {
          return jsonResponse({
            success: false,
            error: {
              code: 'LAST_ADMIN_PROTECTED',
              message: 'Operation Denied: Cannot delete the last remaining active Administrator in the system.',
            },
          }, 400, cors);
        }
      }

      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

      await env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, ip_address, created_at)
        VALUES (?, ?, ?, 'USER_DELETED', 'USER', ?, ?, datetime('now'))
      `).bind(
        `aud_${Date.now()}`,
        authSession.user.id,
        authSession.user.email,
        `Administrator deleted user account "${targetUser.fullName}" (${targetUser.email}).`,
        request.headers.get('cf-connecting-ip') || 'edge'
      ).run();

      return jsonResponse({
        success: true,
        message: `Account "${targetUser.fullName}" (${targetUser.email}) has been permanently deleted and all sessions revoked.`,
      }, 200, cors);
    }

    // ----------------------------------------------------
    // 9. ADMIN: ANALYTICS & DASHBOARD
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
    // 10. ADMIN: SITE SETTINGS & HERO
    // ----------------------------------------------------
    if (path === '/api/admin/settings') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const settings = await env.DB.prepare('SELECT * FROM site_settings LIMIT 1').first();
        return jsonResponse({
          success: true,
          data: {
            ...settings,
            socialLinks: parseJson(settings?.social_links, {}),
          },
        }, 200, cors);
      }
      if (method === 'PUT') {
        if (authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE site_settings SET
            brand_name = COALESCE(?, brand_name),
            slogan = COALESCE(?, slogan),
            default_seo_title = COALESCE(?, default_seo_title),
            default_seo_description = COALESCE(?, default_seo_description),
            contact_email = COALESCE(?, contact_email),
            notification_email = COALESCE(?, notification_email),
            contact_phone = COALESCE(?, contact_phone),
            address = COALESCE(?, address),
            social_links = COALESCE(?, social_links),
            footer_note = COALESCE(?, footer_note),
            copyright = COALESCE(?, copyright),
            budget_comparison_message = COALESCE(?, budget_comparison_message),
            updated_at = datetime('now')
          WHERE id = 'settings_default'
        `).bind(
          b.brandName || null, b.slogan || null, b.defaultSeoTitle || null, b.defaultSeoDescription || null,
          b.contactEmail || null, b.notificationEmail || null, b.contactPhone || null, b.address || null,
          b.socialLinks ? JSON.stringify(b.socialLinks) : null, b.footerNote || null, b.copyright || null,
          b.budgetComparisonMessage || null
        ).run();

        const updated = await env.DB.prepare('SELECT * FROM site_settings LIMIT 1').first();
        return jsonResponse({ success: true, data: updated }, 200, cors);
      }
    }

    if (path === '/api/admin/hero') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const hero = await env.DB.prepare('SELECT * FROM hero_content LIMIT 1').first();
        return jsonResponse({
          success: true,
          data: { ...hero, stats: parseJson(hero?.stats, []) },
        }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE hero_content SET
            headline = COALESCE(?, headline),
            tagline = COALESCE(?, tagline),
            subtext = COALESCE(?, subtext),
            primary_cta_text = COALESCE(?, primary_cta_text),
            secondary_cta_text = COALESCE(?, secondary_cta_text),
            badge_text = COALESCE(?, badge_text),
            background_image_url = COALESCE(?, background_image_url),
            stats = COALESCE(?, stats),
            updated_at = datetime('now')
          WHERE id = 'hero_default'
        `).bind(
          b.headline || null, b.tagline || null, b.subtext || null,
          b.primaryCtaText || null, b.secondaryCtaText || null, b.badgeText || null,
          b.backgroundImageUrl || null, b.stats ? JSON.stringify(b.stats) : null
        ).run();

        const updated = await env.DB.prepare('SELECT * FROM hero_content LIMIT 1').first();
        return jsonResponse({ success: true, data: updated }, 200, cors);
      }
    }

    // Core Service
    if (path === '/api/admin/core-service') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const core = await env.DB.prepare('SELECT * FROM core_services LIMIT 1').first();
        return jsonResponse({
          success: true,
          data: {
            ...core,
            monthlyStartingPrice: core?.monthly_starting_price,
            utilityAllowanceNote: core?.utility_allowance_note,
            resortAmenities: parseJson(core?.resort_amenities, []),
            personalAssistant: core?.personal_assistant,
            cleaningSchedule: core?.cleaning_schedule,
            internetSpeed: core?.internet_speed,
            visaSupportNote: core?.visa_support_note,
            healthInsuranceSupportNote: core?.health_insurance_support_note,
            bankingSupportNote: core?.banking_support_note,
          },
        }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE core_services SET
            title = COALESCE(?, title),
            monthly_starting_price = COALESCE(?, monthly_starting_price),
            description = COALESCE(?, description),
            utility_allowance_note = COALESCE(?, utility_allowance_note),
            resort_amenities = COALESCE(?, resort_amenities),
            personal_assistant = COALESCE(?, personal_assistant),
            cleaning_schedule = COALESCE(?, cleaning_schedule),
            internet_speed = COALESCE(?, internet_speed),
            visa_support_note = COALESCE(?, visa_support_note),
            health_insurance_support_note = COALESCE(?, health_insurance_support_note),
            banking_support_note = COALESCE(?, banking_support_note),
            updated_at = datetime('now')
          WHERE id = 'core_default'
        `).bind(
          b.title || null, b.monthlyStartingPrice || null, b.description || null,
          b.utilityAllowanceNote || null, b.resortAmenities ? JSON.stringify(b.resortAmenities) : null,
          b.personalAssistant || null, b.cleaningSchedule || null, b.internetSpeed || null,
          b.visaSupportNote || null, b.healthInsuranceSupportNote || null, b.bankingSupportNote || null
        ).run();

        const updated = await env.DB.prepare('SELECT * FROM core_services LIMIT 1').first();
        return jsonResponse({ success: true, data: updated }, 200, cors);
      }
    }

    // Why Vietnam CRUD
    if (path === '/api/admin/why-vietnam') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM why_vietnam ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((w: any) => ({
            ...w,
            displayOrder: w.display_order,
            isPublished: Boolean(w.is_published),
            highlight: w.subtitle || (Array.isArray(parseJson(w.highlights)) ? parseJson(w.highlights)[0] : ''),
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        const id = `wv_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO why_vietnam (id, title, subtitle, description, highlights, icon, display_order, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id, b.title || 'Untitled', b.highlight || b.subtitle || '', b.description || '',
          JSON.stringify([b.highlight || '']), b.icon || 'ShieldCheck', b.displayOrder || 1, b.isPublished !== false ? 1 : 0
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/why-vietnam/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const id = path.split('/')[4];
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM why_vietnam WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Item deleted' }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE why_vietnam SET
            title = COALESCE(?, title),
            subtitle = COALESCE(?, subtitle),
            description = COALESCE(?, description),
            highlights = COALESCE(?, highlights),
            icon = COALESCE(?, icon),
            display_order = COALESCE(?, display_order),
            is_published = COALESCE(?, is_published),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          b.title || null, b.highlight || b.subtitle || null, b.description || null,
          b.highlight ? JSON.stringify([b.highlight]) : null, b.icon || null,
          b.displayOrder ?? null, b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          id
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 200, cors);
      }
    }

    // Why Choose Us CRUD
    if (path === '/api/admin/why-choose-us') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM why_choose_us ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((w: any) => ({
            ...w,
            displayOrder: w.display_order,
            isPublished: Boolean(w.is_published),
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        const id = `wcu_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO why_choose_us (id, title, description, icon, display_order, is_published)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          id, b.title || 'Untitled', b.description || '', b.icon || 'Compass',
          b.displayOrder || 1, b.isPublished !== false ? 1 : 0
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/why-choose-us/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const id = path.split('/')[4];
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM why_choose_us WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Item deleted' }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE why_choose_us SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            icon = COALESCE(?, icon),
            display_order = COALESCE(?, display_order),
            is_published = COALESCE(?, is_published)
          WHERE id = ?
        `).bind(
          b.title || null, b.description || null, b.icon || null,
          b.displayOrder ?? null, b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          id
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 200, cors);
      }
    }

    // Additional Services CRUD
    if (path === '/api/admin/additional-services') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM additional_services ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((s: any) => ({
            ...s,
            priceLabel: s.price_label,
            displayOrder: s.display_order,
            isPublished: Boolean(s.is_published),
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        const id = `as_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO additional_services (id, title, description, price_label, category, icon, conditions, display_order, is_published, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          id, b.title || 'Untitled', b.description || '', b.priceLabel || '',
          b.category || 'Concierge', b.icon || 'Sparkles', b.conditions || '',
          b.displayOrder || 1, b.isPublished !== false ? 1 : 0
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/additional-services/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const id = path.split('/')[4];
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM additional_services WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Service deleted' }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE additional_services SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            price_label = COALESCE(?, price_label),
            category = COALESCE(?, category),
            icon = COALESCE(?, icon),
            conditions = COALESCE(?, conditions),
            display_order = COALESCE(?, display_order),
            is_published = COALESCE(?, is_published),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          b.title || null, b.description || null, b.priceLabel || null,
          b.category || null, b.icon || null, b.conditions || null,
          b.displayOrder ?? null, b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          id
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 200, cors);
      }
    }

    // ----------------------------------------------------
    // 11. ADMIN: PACKAGES & ACCOMMODATIONS CRUD
    // ----------------------------------------------------
    if (path === '/api/admin/packages') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM packages ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((p: any) => ({
            ...p,
            packageCode: p.package_code,
            durationLabel: p.duration_label,
            durationCategory: p.duration_category,
            targetAudience: p.target_audience,
            startingPriceUsd: p.starting_price_usd,
            idealFor: parseJson(p.ideal_for, []),
            inclusions: parseJson(p.inclusions, []),
            isPublished: Boolean(p.is_published),
            displayOrder: p.display_order,
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        const id = `pkg_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO packages (id, package_code, title, duration_label, duration_category, target_audience, starting_price_usd, description, ideal_for, inclusions, display_order, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id, b.packageCode || id, b.title, b.durationLabel || '', b.durationCategory || 'Trial',
          b.targetAudience || '', b.startingPriceUsd || 0, b.description || '',
          JSON.stringify(b.idealFor || []), JSON.stringify(b.inclusions || []), b.displayOrder || 1, b.isPublished ? 1 : 0
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/packages/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const pkgId = path.split('/')[4];
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM packages WHERE id = ?').bind(pkgId).run();
        return jsonResponse({ success: true, message: 'Package deleted' }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE packages SET
            title = COALESCE(?, title),
            duration_label = COALESCE(?, duration_label),
            target_audience = COALESCE(?, target_audience),
            starting_price_usd = COALESCE(?, starting_price_usd),
            description = COALESCE(?, description),
            ideal_for = COALESCE(?, ideal_for),
            inclusions = COALESCE(?, inclusions),
            display_order = COALESCE(?, display_order),
            is_published = COALESCE(?, is_published),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          b.title || null, b.durationLabel || null, b.targetAudience || null,
          b.startingPriceUsd !== undefined ? b.startingPriceUsd : null, b.description || null,
          b.idealFor ? JSON.stringify(b.idealFor) : null, b.inclusions ? JSON.stringify(b.inclusions) : null,
          b.displayOrder !== undefined ? b.displayOrder : null, b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          pkgId
        ).run();
        return jsonResponse({ success: true, data: { id: pkgId, ...b } }, 200, cors);
      }
    }

    // Destination Hubs (Provinces / Cities)
    if (path === '/api/admin/hubs') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM destination_hubs ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((h: any) => ({
            id: h.id,
            name: h.name,
            hubName: h.hub_name,
            tagline: h.tagline,
            description: h.description,
            badgeClass: h.badge_class,
            heroImage: h.hero_image,
            displayOrder: h.display_order,
            isPublished: Boolean(h.is_published),
            createdAt: h.created_at,
            updatedAt: h.updated_at,
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        if (!b.name || !b.name.trim()) return jsonResponse({ success: false, error: { message: 'City / Province name is required.' } }, 400, cors);
        const existing = await env.DB.prepare('SELECT id FROM destination_hubs WHERE LOWER(name) = LOWER(?)').bind(b.name.trim()).first();
        if (existing) return jsonResponse({ success: false, error: { message: `Destination Hub for "${b.name}" already exists.` } }, 400, cors);

        const id = b.id || `hub_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO destination_hubs (id, name, hub_name, tagline, description, badge_class, hero_image, display_order, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id, b.name.trim(), b.hubName || `${b.name.trim()} Sanctuary Hub`,
          b.tagline || `Extended-stay and retirement residences in ${b.name.trim()}`,
          b.description || `Premier retirement community in ${b.name.trim()}.`,
          b.badgeClass || 'bg-emerald-100 text-emerald-800 border-emerald-300',
          b.heroImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          b.displayOrder || 1, b.isPublished !== false ? 1 : 0
        ).run();

        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/hubs/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const hubId = path.split('/')[4];
      if (method === 'DELETE') {
        const hub = await env.DB.prepare('SELECT name FROM destination_hubs WHERE id = ?').bind(hubId).first();
        if (!hub) return jsonResponse({ success: false, error: { message: 'Hub not found.' } }, 404, cors);

        const linked = (await env.DB.prepare('SELECT id, title FROM accommodations WHERE LOWER(city) = LOWER(?)').bind(hub.name).all()).results || [];
        if (linked.length > 0) {
          return jsonResponse({
            success: false,
            error: {
              code: 'LINKED_ACCOMMODATIONS_EXIST',
              message: `Cannot delete Destination Hub: ${linked.length} residence(s) (${linked.map((l: any) => l.title).join(', ')}) are located in this city. Please reassign or delete these accommodations first.`,
            },
          }, 400, cors);
        }

        await env.DB.prepare('DELETE FROM destination_hubs WHERE id = ?').bind(hubId).run();
        return jsonResponse({ success: true, message: 'Destination Hub deleted.' }, 200, cors);
      }

      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE destination_hubs SET
            name = COALESCE(?, name),
            hub_name = COALESCE(?, hub_name),
            tagline = COALESCE(?, tagline),
            description = COALESCE(?, description),
            badge_class = COALESCE(?, badge_class),
            hero_image = COALESCE(?, hero_image),
            display_order = COALESCE(?, display_order),
            is_published = COALESCE(?, is_published),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          b.name || null, b.hubName || null, b.tagline || null, b.description || null,
          b.badgeClass || null, b.heroImage || null, b.displayOrder !== undefined ? b.displayOrder : null,
          b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          hubId
        ).run();
        return jsonResponse({ success: true, data: { id: hubId, ...b } }, 200, cors);
      }
    }

    if (path === '/api/admin/accommodations') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      if (method === 'GET') {
        const rows = (await env.DB.prepare('SELECT * FROM accommodations ORDER BY display_order ASC').all()).results || [];
        return jsonResponse({
          success: true,
          data: rows.map((a: any) => ({
            ...a,
            roomType: a.room_type,
            sizeSqm: a.size_sqm,
            priceMonthUsd: a.price_month_usd,
            features: parseJson(a.features, []),
            nearbyAmenities: parseJson(a.nearby_amenities, []),
            images: parseJson(a.images, []),
            isFlagship: Boolean(a.is_flagship),
            isPublished: Boolean(a.is_published),
            displayOrder: a.display_order,
          })),
        }, 200, cors);
      }
      if (method === 'POST') {
        const b = (await request.json().catch(() => ({}))) as any;
        const id = `acc_${Date.now()}`;
        await env.DB.prepare(`
          INSERT INTO accommodations (id, title, city, district, neighborhood, room_type, size_sqm, bedrooms, bathrooms, price_month_usd, description, features, nearby_amenities, images, is_flagship, display_order, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id, b.title, b.city, b.district || '', b.neighborhood || '', b.roomType || 'Serviced Suite',
          b.sizeSqm || 65, b.bedrooms || 1, b.bathrooms || 1, b.priceMonthUsd || 2250, b.description || '',
          JSON.stringify(b.features || []), JSON.stringify(b.nearbyAmenities || []), JSON.stringify(b.images || []),
          b.isFlagship ? 1 : 0, b.displayOrder || 1, b.isPublished ? 1 : 0
        ).run();
        return jsonResponse({ success: true, data: { id, ...b } }, 201, cors);
      }
    }

    if (path.startsWith('/api/admin/accommodations/') && (method === 'PUT' || method === 'DELETE')) {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const accId = path.split('/')[4];
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM accommodations WHERE id = ?').bind(accId).run();
        return jsonResponse({ success: true, message: 'Accommodation deleted' }, 200, cors);
      }
      if (method === 'PUT') {
        const b = (await request.json().catch(() => ({}))) as any;
        await env.DB.prepare(`
          UPDATE accommodations SET
            title = COALESCE(?, title),
            city = COALESCE(?, city),
            district = COALESCE(?, district),
            price_month_usd = COALESCE(?, price_month_usd),
            description = COALESCE(?, description),
            features = COALESCE(?, features),
            images = COALESCE(?, images),
            is_flagship = COALESCE(?, is_flagship),
            is_published = COALESCE(?, is_published),
            display_order = COALESCE(?, display_order),
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          b.title || null, b.city || null, b.district || null,
          b.priceMonthUsd !== undefined ? b.priceMonthUsd : null, b.description || null,
          b.features ? JSON.stringify(b.features) : null, b.images ? JSON.stringify(b.images) : null,
          b.isFlagship !== undefined ? (b.isFlagship ? 1 : 0) : null,
          b.isPublished !== undefined ? (b.isPublished ? 1 : 0) : null,
          b.displayOrder !== undefined ? b.displayOrder : null,
          accId
        ).run();
        return jsonResponse({ success: true, data: { id: accId, ...b } }, 200, cors);
      }
    }

    // ----------------------------------------------------
    // 12. ADMIN: LEADS DETAIL, STATUS & NOTES
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

    if (path.startsWith('/api/admin/leads/') && !path.includes('/status') && !path.includes('/notes') && !path.includes('/assign') && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leadId = path.split('/')[4];
      const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
      if (!lead) return jsonResponse({ success: false, error: { message: 'Lead not found' } }, 404, cors);

      const notes = (await env.DB.prepare('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC').bind(leadId).all()).results || [];
      const history = (await env.DB.prepare('SELECT * FROM lead_status_history WHERE lead_id = ? ORDER BY changed_at DESC').bind(leadId).all()).results || [];

      return jsonResponse({
        success: true,
        data: {
          lead: {
            id: lead.id,
            leadCode: lead.lead_code,
            fullName: lead.full_name,
            email: lead.email,
            phone: lead.phone,
            countryCode: lead.country_code,
            status: lead.status,
            priority: lead.priority,
            packageName: lead.package_name,
            destinationCity: lead.destination_city,
            duration: lead.duration,
            createdAt: lead.created_at,
          },
          notes: notes.map((n: any) => ({
            id: n.id,
            authorName: n.author_name,
            content: n.content,
            createdAt: n.created_at,
          })),
          history: history.map((h: any) => ({
            id: h.id,
            oldStatus: h.old_status,
            newStatus: h.new_status,
            changedByName: h.changed_by_name,
            note: h.note,
            changedAt: h.changed_at,
          })),
        },
      }, 200, cors);
    }

    if (path.startsWith('/api/admin/leads/') && path.endsWith('/status') && method === 'PUT') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leadId = path.split('/')[4];
      const { status, note, priority } = (await request.json().catch(() => ({}))) as any;

      const current = await env.DB.prepare('SELECT status FROM leads WHERE id = ?').bind(leadId).first();
      if (!current) return jsonResponse({ success: false, error: { message: 'Lead not found' } }, 404, cors);

      const now = new Date().toISOString();
      await env.DB.prepare('UPDATE leads SET status = ?, priority = COALESCE(?, priority), updated_at = ? WHERE id = ?')
        .bind(status, priority || null, now, leadId).run();

      await env.DB.prepare(`
        INSERT INTO lead_status_history (id, lead_id, old_status, new_status, changed_by_id, changed_by_name, note, changed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(`lsh_${Date.now()}`, leadId, current.status, status, authSession.user.id, authSession.user.fullName, note || '', now).run();

      return jsonResponse({ success: true, message: 'Status updated' }, 200, cors);
    }

    if (path.startsWith('/api/admin/leads/') && path.endsWith('/notes') && method === 'POST') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leadId = path.split('/')[4];
      const { content } = (await request.json().catch(() => ({}))) as any;
      if (!content || !content.trim()) return jsonResponse({ success: false, error: { message: 'Note required' } }, 400, cors);

      const noteId = `note_${Date.now()}`;
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO lead_notes (id, lead_id, author_id, author_name, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(noteId, leadId, authSession.user.id, authSession.user.fullName, content.trim(), now).run();

      return jsonResponse({ success: true, data: { id: noteId, authorName: authSession.user.fullName, content, createdAt: now } }, 201, cors);
    }

    // ----------------------------------------------------
    // 13. ADMIN: EXPORT CSV & EXCEL
    // ----------------------------------------------------
    if (path === '/api/admin/export/csv' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leads = (await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()).results || [];
      const headers = ['Lead Code', 'Date', 'Full Name', 'Email', 'Phone', 'Country', 'Package', 'Destination', 'Status', 'Priority'];
      const rows = leads.map((l: any) => [
        sanitizeCsvCell(l.lead_code),
        sanitizeCsvCell(l.created_at?.split('T')[0]),
        sanitizeCsvCell(l.full_name),
        sanitizeCsvCell(l.email),
        sanitizeCsvCell(l.phone),
        sanitizeCsvCell(l.country_code),
        sanitizeCsvCell(l.package_name),
        sanitizeCsvCell(l.destination_city),
        sanitizeCsvCell(l.status),
        sanitizeCsvCell(l.priority),
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="wanderers_leads_${new Date().toISOString().split('T')[0]}.csv"`,
          ...cors,
        },
      });
    }

    if (path === '/api/admin/export/excel' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const leads = (await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()).results || [];
      const rowsXml = leads.map((l: any) => `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(l.lead_code)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.created_at?.split('T')[0])}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.full_name)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.email)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.phone || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.country_code || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.package_name || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.destination_city || '')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(l.status)}</Data></Cell>
        </Row>
      `).join('');

      const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Leads">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Code</Data></Cell>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Name</Data></Cell>
        <Cell><Data ss:Type="String">Email</Data></Cell>
        <Cell><Data ss:Type="String">Phone</Data></Cell>
        <Cell><Data ss:Type="String">Country</Data></Cell>
        <Cell><Data ss:Type="String">Package</Data></Cell>
        <Cell><Data ss:Type="String">City</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
      </Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`;

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="wanderers_leads_${new Date().toISOString().split('T')[0]}.xls"`,
          ...cors,
        },
      });
    }

    // ----------------------------------------------------
    // 14. ADMIN: EMAIL QUEUE & AUDIT LOGS
    // ----------------------------------------------------
    if (path === '/api/admin/email-jobs' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const jobs = (await env.DB.prepare('SELECT * FROM email_jobs ORDER BY scheduled_at DESC LIMIT 50').all()).results || [];
      return jsonResponse({
        success: true,
        data: jobs.map((j: any) => ({
          id: j.id,
          recipientEmail: j.recipient_email,
          subject: j.subject,
          bodyPreview: j.body_preview,
          status: j.status,
          attempts: j.attempts,
          scheduledAt: j.scheduled_at,
          sentAt: j.sent_at,
          lastError: j.last_error,
        })),
      }, 200, cors);
    }

    if (path.startsWith('/api/admin/email-jobs/') && path.endsWith('/retry') && method === 'POST') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const jobId = path.split('/')[4];
      const job = await env.DB.prepare('SELECT * FROM email_jobs WHERE id = ?').bind(jobId).first();
      if (!job) return jsonResponse({ success: false, error: { message: 'Job not found' } }, 404, cors);

      const res = await sendNotificationEmail(env, {
        fullName: 'Retry Test',
        email: job.recipient_email,
        packageName: job.subject,
      });

      await env.DB.prepare('UPDATE email_jobs SET status = ?, attempts = attempts + 1, sent_at = datetime(\'now\') WHERE id = ?')
        .bind(res.status, jobId).run();

      return jsonResponse({ success: true, message: `Email retry status: ${res.status}` }, 200, cors);
    }

    if (path === '/api/admin/audit-logs' && method === 'GET') {
      if (!authSession || authSession.user.role !== 'ADMIN') return jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403, cors);
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
    // 15. ADMIN: MEDIA MANAGEMENT (R2)
    // ----------------------------------------------------
    if (path === '/api/admin/media' && method === 'GET') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const media = (await env.DB.prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all()).results || [];
      return jsonResponse({
        success: true,
        data: media.map((m: any) => ({
          id: m.id,
          filename: m.filename,
          originalName: m.original_name,
          url: m.url,
          mimeType: m.mime_type,
          sizeBytes: m.size_bytes,
          altText: m.alt_text,
          category: m.category,
          createdAt: m.created_at,
        })),
      }, 200, cors);
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

      const publicUrl = `/media/${key}`;
      const assetId = `med_${Date.now()}`;

      await env.DB.prepare(`
        INSERT INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_text, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'general', datetime('now'))
      `).bind(assetId, key, file.name, file.type, file.size, publicUrl, file.name).run();

      return jsonResponse({ success: true, data: { id: assetId, url: publicUrl, filename: key } }, 200, cors);
    }

    if (path.startsWith('/api/admin/media/') && method === 'DELETE') {
      if (!authSession) return jsonResponse({ success: false, error: { message: 'Unauthorized' } }, 401, cors);
      const mediaId = path.split('/')[4];
      const asset = await env.DB.prepare('SELECT filename FROM media_assets WHERE id = ?').bind(mediaId).first();
      if (asset && env.MEDIA_BUCKET) {
        try {
          await env.MEDIA_BUCKET.delete(asset.filename);
        } catch (e) {
          console.warn('R2 delete note:', e);
        }
      }
      await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(mediaId).run();
      return jsonResponse({ success: true, message: 'Media removed.' }, 200, cors);
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
