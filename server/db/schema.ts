/**
 * Schema and Type Definitions for Wanderer's Journeys Fullstack System
 * Supports both PostgreSQL migration alignment and transactional JSON/Memory store.
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'LEAD_MANAGER';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
}

export interface SectionHeader {
  badge: string;
  title: string;
  description: string;
}

export interface WhyVietnamHeader extends SectionHeader {}

export interface FinancialProjection {
  badge: string;
  title: string;
  comparisonMessage: string;
  assumptionsTitle: string;
  assumptionsNote: string;
}

export interface PackagesHeader extends SectionHeader {}
export interface AccommodationsHeader extends SectionHeader {}
export interface InquiryHeader extends SectionHeader {}

export interface WhyChooseUsHeader extends SectionHeader {
  trustBadge: string;
}

export interface AdditionalServicesHeader extends SectionHeader {
  ctaButtonText: string;
}

export interface FaqsHeader extends SectionHeader {
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
}

export interface SiteSettings {
  id: string;
  brandName: string;
  slogan: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  contactEmail: string;
  notificationEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: SocialLinks;
  footerNote: string;
  copyright: string;
  budgetComparisonMessage: string;
  whyVietnamHeader?: WhyVietnamHeader;
  financialProjection?: FinancialProjection;
  packagesHeader?: PackagesHeader;
  accommodationsHeader?: AccommodationsHeader;
  whyChooseUsHeader?: WhyChooseUsHeader;
  additionalServicesHeader?: AdditionalServicesHeader;
  faqsHeader?: FaqsHeader;
  inquiryHeader?: InquiryHeader;
  updatedAt: string;
}

export interface HeroValueBadge {
  id: string;
  text: string;
  icon?: string;
  displayOrder: number;
}

export interface HeroContent {
  headline: string;
  tagline: string;
  subtext: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  badgeText: string;
  backgroundImageUrl: string;
  stats: Array<{ label: string; value: string }>;
  valueBadges?: HeroValueBadge[];
}

export interface WhyVietnamItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface CoreInclusionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  bulletPoints?: string[];
  displayOrder: number;
  isPublished: boolean;
}

export interface CoreServiceItem {
  id: string;
  sectionBadge?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  baselineBadge?: string;
  title: string;
  monthlyStartingPrice: number;
  pricePeriodLabel?: string;
  priceSubtext?: string;
  description: string;
  utilityAllowanceNote: string;
  resortAmenities: string[];
  personalAssistant: string;
  cleaningSchedule: string;
  internetSpeed: string;
  visaSupportNote: string;
  healthInsuranceSupportNote: string;
  bankingSupportNote: string;
  inclusions?: CoreInclusionCard[];
  displayOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdditionalServiceItem {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  category: string;
  icon: string;
  conditions: string;
  partnerInfo?: string;
  ctaText?: string;
  isPublished: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface DestinationHubItem {
  id: string;
  name: string; // e.g. "Da Nang", "Nha Trang", "Ho Chi Minh City"
  hubName: string; // e.g. "Da Nang Coastal Beaches & Nature Hub"
  tagline: string;
  description: string;
  badgeClass: string;
  heroImage: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageItem {
  id: string;
  code: string;
  title: string;
  tag: string;
  duration: string;
  priceRange: string;
  isCustomQuote: boolean;
  summary: string;
  inclusions: string[];
  exclusions: string[];
  idealFor: string;
  conditions: string;
  imageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface AccommodationImage {
  id: string;
  url: string;
  caption: string;
  isPrimary: boolean;
}

export interface AccommodationItem {
  id: string;
  title: string;
  city: string; // Dynamically links to DestinationHubItem.name
  district: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  priceMonthUsd: number;
  isQuoteOnly: boolean;
  description: string;
  amenities: string[];
  images: AccommodationImage[];
  isPublished: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altText: string;
  category: 'accommodations' | 'destinations' | 'amenities' | 'general';
  createdAt: string;
}

export interface FAQItem {
  id: string;
  category: 'General' | 'Visa & Legal' | 'Healthcare' | 'Accommodation' | 'Finance';
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'number';

export interface InquiryFormField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: FormFieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isSystem: boolean; // cannot be deleted
  isEnabled: boolean; // can be toggled
  displayOrder: number;
  options?: string[];
  validationRule?: string;
  sectionGroup: 'personal' | 'stay_preferences' | 'accommodation' | 'notes';
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Lead {
  id: string;
  leadCode: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  expectedStartDate: string;
  duration: string;
  guestCount: number;
  ageGroups: string;
  packageCode: string;
  packageName: string;
  destinationCity: string;
  preferredAccommodationType: string;
  activities: string[];
  transportPreference: string;
  estimatedBudget: string;
  additionalNotes: string;
  consentAccepted: boolean;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: string; // User ID
  source: string;
  ipAddress?: string;
  userAgent?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface LeadStatusHistory {
  id: string;
  leadId: string;
  oldStatus: LeadStatus;
  newStatus: LeadStatus;
  changedById: string;
  changedByName: string;
  note?: string;
  changedAt: string;
}

export type EmailJobStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SIMULATED';

export interface EmailJob {
  id: string;
  leadId: string;
  recipientEmail: string;
  subject: string;
  bodyPreview: string;
  status: EmailJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledAt: string;
  sentAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  sessions: Session[];
  passwordResetTokens: PasswordResetToken[];
  siteSettings: SiteSettings;
  heroContent: HeroContent;
  whyVietnam: WhyVietnamItem[];
  whyChooseUs: Array<{ id: string; title: string; description: string; icon: string }>;
  coreService: CoreServiceItem;
  additionalServices: AdditionalServiceItem[];
  packages: PackageItem[];
  destinationHubs: DestinationHubItem[];
  accommodations: AccommodationItem[];
  mediaAssets: MediaAsset[];
  faqs: FAQItem[];
  formFields: InquiryFormField[];
  leads: Lead[];
  leadNotes: LeadNote[];
  leadStatusHistory: LeadStatusHistory[];
  emailJobs: EmailJob[];
  auditLogs: AuditLog[];
}
