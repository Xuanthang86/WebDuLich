export type UserRole = 'ADMIN' | 'MANAGER' | 'LEAD_MANAGER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface SiteSettings {
  brandName: string;
  slogan: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  contactEmail: string;
  notificationEmail?: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  footerNote: string;
  copyright: string;
  budgetComparisonMessage: string;
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

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface CoreServiceItem {
  id: string;
  title: string;
  monthlyStartingPrice: number;
  description: string;
  utilityAllowanceNote: string;
  resortAmenities: string[];
  personalAssistant: string;
  cleaningSchedule: string;
  internetSpeed: string;
  visaSupportNote: string;
  healthInsuranceSupportNote: string;
  bankingSupportNote: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface AdditionalServiceItem {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  category: string;
  icon: string;
  conditions: string;
  isPublished: boolean;
  displayOrder: number;
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
  city: 'Ho Chi Minh City' | 'Da Nang' | 'Nha Trang';
  district: string;
  propertyType: 'Luxury Apartment' | 'Ocean Villa' | 'Boutique Townhouse' | 'Resort Suite';
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
}

export interface FAQItem {
  id: string;
  category: 'General' | 'Visa & Legal' | 'Healthcare' | 'Accommodation' | 'Finance';
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface InquiryFormField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'number';
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isSystem: boolean;
  isEnabled: boolean;
  displayOrder: number;
  options?: string[];
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
  assignedTo?: string;
  source: string;
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

export interface EmailJob {
  id: string;
  leadId: string;
  recipientEmail: string;
  subject: string;
  bodyPreview: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
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
