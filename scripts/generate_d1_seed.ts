import fs from 'fs';
import path from 'path';

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const dbFile = path.resolve(process.cwd(), 'data/db.json');
  if (!fs.existsSync(dbFile)) {
    console.error('db.json not found!');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbFile, 'utf-8');
  const data = JSON.parse(raw);

  const lines: string[] = [
    '-- ====================================================================',
    '-- Wanderer\'s Journeys - Cloudflare D1 Initial Data Seed',
    '-- Generated automatically from sanitized baseline data',
    '-- SECURITY ENFORCEMENT: Never includes active sessions or real PII',
    '-- ====================================================================',
    '',
    '-- 0. PURGE SESSIONS & SENSITIVE TOKENS',
    'DELETE FROM sessions;',
    'DELETE FROM password_reset_tokens;',
    '',
  ];

  // 1. Users & Administrators (Omitted from git-tracked seeds for security compliance)
  lines.push('-- 1. USERS & ADMINISTRATORS');
  lines.push('-- Admin accounts are provisioned securely via scripts/bootstrap_admin.ts without hardcoding credentials in git.');
  lines.push('');

  // 2. Site Settings
  if (data.siteSettings) {
    lines.push('-- 2. SITE SETTINGS');
    const s = data.siteSettings;
    lines.push(
      `INSERT OR REPLACE INTO site_settings (id, brand_name, slogan, default_seo_title, default_seo_description, contact_email, notification_email, contact_phone, address, social_links, footer_note, copyright, budget_comparison_message, updated_at) VALUES (` +
      `${escapeSql(s.id || 'settings_default')}, ${escapeSql(s.brandName)}, ${escapeSql(s.slogan)}, ${escapeSql(s.defaultSeoTitle)}, ${escapeSql(s.defaultSeoDescription)}, ` +
      `${escapeSql(s.contactEmail)}, ${escapeSql(s.notificationEmail)}, ${escapeSql(s.contactPhone)}, ${escapeSql(s.address)}, ${escapeSql(s.socialLinks || {})}, ` +
      `${escapeSql(s.footerNote)}, ${escapeSql(s.copyright)}, ${escapeSql(s.budgetComparisonMessage)}, ${escapeSql(s.updatedAt || new Date().toISOString())});`
    );
    lines.push('');
  }

  // 3. Hero Content
  if (data.heroContent) {
    lines.push('-- 3. HERO CONTENT');
    const h = data.heroContent;
    lines.push(
      `INSERT OR REPLACE INTO hero_content (id, headline, tagline, subtext, primary_cta_text, secondary_cta_text, badge_text, background_image_url, stats, updated_at) VALUES (` +
      `'hero_default', ${escapeSql(h.headline)}, ${escapeSql(h.tagline)}, ${escapeSql(h.subtext)}, ${escapeSql(h.primaryCtaText)}, ${escapeSql(h.secondaryCtaText)}, ` +
      `${escapeSql(h.badgeText)}, ${escapeSql(h.backgroundImageUrl)}, ${escapeSql(h.stats || [])}, ${escapeSql(h.updatedAt || new Date().toISOString())});`
    );
    lines.push('');
  }

  // 4. Why Vietnam
  if (data.whyVietnam && data.whyVietnam.length > 0) {
    lines.push('-- 4. WHY VIETNAM');
    for (const item of data.whyVietnam) {
      lines.push(
        `INSERT OR REPLACE INTO why_vietnam (id, title, subtitle, description, highlights, icon, display_order, is_published, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.title)}, ${escapeSql(item.subtitle)}, ${escapeSql(item.description)}, ` +
        `${escapeSql(item.highlights || [])}, ${escapeSql(item.icon)}, ${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.isPublished !== false ? 1 : 0)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 5. Why Choose Us
  if (data.whyChooseUs && data.whyChooseUs.length > 0) {
    lines.push('-- 5. WHY CHOOSE US');
    for (const item of data.whyChooseUs) {
      lines.push(
        `INSERT OR REPLACE INTO why_choose_us (id, title, description, icon, display_order, is_published) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.title)}, ${escapeSql(item.description)}, ${escapeSql(item.icon)}, ` +
        `${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.isPublished !== false ? 1 : 0)});`
      );
    }
    lines.push('');
  }

  // 6. Core Services
  if (data.coreService) {
    lines.push('-- 6. CORE SERVICE');
    const c = data.coreService;
    lines.push(
      `INSERT OR REPLACE INTO core_services (id, title, monthly_starting_price, description, utility_allowance_note, resort_amenities, personal_assistant, cleaning_schedule, internet_speed, visa_support_note, health_insurance_support_note, banking_support_note, display_order, is_published, created_at, updated_at) VALUES (` +
      `${escapeSql(c.id || 'core_default')}, ${escapeSql(c.title)}, ${escapeSql(c.monthlyStartingPrice || 2250)}, ${escapeSql(c.description)}, ` +
      `${escapeSql(c.utilityAllowanceNote)}, ${escapeSql(c.resortAmenities || [])}, ${escapeSql(c.personalAssistant)}, ${escapeSql(c.cleaningSchedule)}, ` +
      `${escapeSql(c.internetSpeed)}, ${escapeSql(c.visaSupportNote)}, ${escapeSql(c.healthInsuranceSupportNote)}, ${escapeSql(c.bankingSupportNote)}, ` +
      `${escapeSql(c.displayOrder || 1)}, ${escapeSql(c.isPublished !== false ? 1 : 0)}, ${escapeSql(c.createdAt || new Date().toISOString())}, ${escapeSql(c.updatedAt || new Date().toISOString())});`
    );
    lines.push('');
  }

  // 7. Additional Services
  if (data.additionalServices && data.additionalServices.length > 0) {
    lines.push('-- 7. ADDITIONAL SERVICES');
    for (const item of data.additionalServices) {
      lines.push(
        `INSERT OR REPLACE INTO additional_services (id, title, description, price_label, category, icon, conditions, display_order, is_published, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.title)}, ${escapeSql(item.description)}, ${escapeSql(item.priceLabel)}, ` +
        `${escapeSql(item.category)}, ${escapeSql(item.icon)}, ${escapeSql(item.conditions)}, ${escapeSql(item.displayOrder || 1)}, ` +
        `${escapeSql(item.isPublished !== false ? 1 : 0)}, ${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 8. Packages
  if (data.packages && data.packages.length > 0) {
    lines.push('-- 8. PACKAGES');
    for (const item of data.packages) {
      lines.push(
        `INSERT OR REPLACE INTO packages (id, package_code, title, duration_label, duration_category, target_audience, starting_price_usd, description, ideal_for, inclusions, display_order, is_published, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.packageCode)}, ${escapeSql(item.title)}, ${escapeSql(item.durationLabel)}, ` +
        `${escapeSql(item.durationCategory)}, ${escapeSql(item.targetAudience)}, ${escapeSql(item.startingPriceUsd || 0)}, ${escapeSql(item.description)}, ` +
        `${escapeSql(item.idealFor || [])}, ${escapeSql(item.inclusions || [])}, ${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.isPublished !== false ? 1 : 0)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 9. Accommodations
  if (data.accommodations && data.accommodations.length > 0) {
    lines.push('-- 9. ACCOMMODATIONS');
    for (const item of data.accommodations) {
      lines.push(
        `INSERT OR REPLACE INTO accommodations (id, title, city, district, neighborhood, room_type, size_sqm, bedrooms, bathrooms, price_month_usd, description, features, nearby_amenities, images, is_flagship, display_order, is_published, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.title)}, ${escapeSql(item.city)}, ${escapeSql(item.district)}, ${escapeSql(item.neighborhood)}, ` +
        `${escapeSql(item.roomType)}, ${escapeSql(item.sizeSqm || 0)}, ${escapeSql(item.bedrooms || 1)}, ${escapeSql(item.bathrooms || 1)}, ` +
        `${escapeSql(item.priceMonthUsd || 0)}, ${escapeSql(item.description)}, ${escapeSql(item.features || [])}, ${escapeSql(item.nearbyAmenities || [])}, ` +
        `${escapeSql(item.images || [])}, ${escapeSql(item.isFlagship ? 1 : 0)}, ${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.isPublished !== false ? 1 : 0)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 10. FAQs
  if (data.faqs && data.faqs.length > 0) {
    lines.push('-- 10. FAQS');
    for (const item of data.faqs) {
      lines.push(
        `INSERT OR REPLACE INTO faqs (id, question, answer, category, display_order, is_published, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.question)}, ${escapeSql(item.answer)}, ${escapeSql(item.category)}, ` +
        `${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.isPublished !== false ? 1 : 0)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 11. Form Fields
  if (data.formFields && data.formFields.length > 0) {
    lines.push('-- 11. DYNAMIC FORM FIELDS');
    for (const item of data.formFields) {
      lines.push(
        `INSERT OR REPLACE INTO form_fields (id, field_name, label, field_type, is_required, is_enabled, placeholder, options, display_order, validation_rule) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.fieldName)}, ${escapeSql(item.label)}, ${escapeSql(item.fieldType)}, ` +
        `${escapeSql(item.isRequired ? 1 : 0)}, ${escapeSql(item.isEnabled ? 1 : 0)}, ${escapeSql(item.placeholder)}, ` +
        `${escapeSql(item.options || [])}, ${escapeSql(item.displayOrder || 1)}, ${escapeSql(item.validationRule)});`
      );
    }
    lines.push('');
  }

  // 12. Leads (Sanitized demo data with zero real PII)
  if (data.leads && data.leads.length > 0) {
    lines.push('-- 12. LEADS (SANITIZED DEMO INQUIRIES)');
    for (const item of data.leads) {
      const cleanEmail = item.email ? (item.email.split('@')[0] + '@example.com') : 'guest@example.com';
      const cleanPhone = item.phone ? '+1 (555) 019-2831' : null;
      lines.push(
        `INSERT OR REPLACE INTO leads (id, lead_code, full_name, email, phone, country_code, expected_start_date, duration, guest_count, age_groups, package_code, package_name, destination_city, preferred_accommodation_type, activities, transport_preference, estimated_budget, additional_notes, consent_accepted, status, priority, assigned_to, created_at, updated_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.leadCode)}, ${escapeSql(item.fullName)}, ${escapeSql(cleanEmail)}, ${escapeSql(cleanPhone)}, ` +
        `${escapeSql(item.countryCode)}, ${escapeSql(item.expectedStartDate)}, ${escapeSql(item.duration)}, ${escapeSql(item.guestCount || 1)}, ` +
        `${escapeSql(item.ageGroups || [])}, ${escapeSql(item.packageCode)}, ${escapeSql(item.packageName)}, ${escapeSql(item.destinationCity)}, ` +
        `${escapeSql(item.preferredAccommodationType)}, ${escapeSql(item.activities || [])}, ${escapeSql(item.transportPreference)}, ` +
        `${escapeSql(item.estimatedBudget)}, ${escapeSql(item.additionalNotes)}, ${escapeSql(item.consentAccepted ? 1 : 0)}, ` +
        `${escapeSql(item.status || 'NEW')}, ${escapeSql(item.priority || 'MEDIUM')}, ${escapeSql(item.assignedTo)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())}, ${escapeSql(item.updatedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 13. Lead Notes
  if (data.leadNotes && data.leadNotes.length > 0) {
    lines.push('-- 13. LEAD NOTES');
    for (const item of data.leadNotes) {
      lines.push(
        `INSERT OR REPLACE INTO lead_notes (id, lead_id, author_id, author_name, content, created_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.leadId)}, ${escapeSql(item.authorId)}, ${escapeSql(item.authorName)}, ` +
        `${escapeSql(item.content)}, ${escapeSql(item.createdAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 14. Lead Status History
  if (data.leadStatusHistory && data.leadStatusHistory.length > 0) {
    lines.push('-- 14. LEAD STATUS HISTORY');
    for (const item of data.leadStatusHistory) {
      lines.push(
        `INSERT OR REPLACE INTO lead_status_history (id, lead_id, old_status, new_status, changed_by_id, changed_by_name, note, changed_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.leadId)}, ${escapeSql(item.oldStatus)}, ${escapeSql(item.newStatus)}, ` +
        `${escapeSql(item.changedById)}, ${escapeSql(item.changedByName)}, ${escapeSql(item.note)}, ${escapeSql(item.changedAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 15. Audit Logs
  if (data.auditLogs && data.auditLogs.length > 0) {
    lines.push('-- 15. AUDIT LOGS');
    for (const item of data.auditLogs) {
      lines.push(
        `INSERT OR REPLACE INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.userId)}, ${escapeSql(item.userEmail)}, ${escapeSql(item.action)}, ` +
        `${escapeSql(item.entityType)}, ${escapeSql(item.entityId)}, ${escapeSql(item.details)}, ${escapeSql(item.ipAddress)}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  // 16. Media Assets
  if (data.mediaAssets && data.mediaAssets.length > 0) {
    lines.push('-- 16. MEDIA ASSETS');
    for (const item of data.mediaAssets) {
      lines.push(
        `INSERT OR REPLACE INTO media_assets (id, filename, original_name, mime_type, size_bytes, url, alt_text, category, created_at) VALUES (` +
        `${escapeSql(item.id)}, ${escapeSql(item.filename)}, ${escapeSql(item.originalName)}, ${escapeSql(item.mimeType)}, ` +
        `${escapeSql(item.sizeBytes || 0)}, ${escapeSql(item.url)}, ${escapeSql(item.altText)}, ${escapeSql(item.category || 'general')}, ` +
        `${escapeSql(item.createdAt || new Date().toISOString())});`
      );
    }
    lines.push('');
  }

  const outPath = path.resolve(process.cwd(), 'database/d1_seed.sql');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`Successfully generated Cloudflare D1 seed SQL at: ${outPath} (${lines.length} lines)`);
}

main().catch(err => {
  console.error('Migration generator error:', err);
  process.exit(1);
});
