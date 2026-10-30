import {
  SiteSettings,
  HeroContent,
  WhyVietnamItem,
  CoreServiceItem,
  AdditionalServiceItem,
  PackageItem,
  AccommodationItem,
  FAQItem,
  InquiryFormField,
  Lead,
  User,
  EmailJob,
  AuditLog,
} from './types';

const TOKEN_KEY = 'wj_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      clearAuthToken();
    }
    throw new Error(data?.error?.message || `Request failed with status ${response.status}`);
  }

  return data.data;
}

// Public API
export interface PublicContentResponse {
  settings: SiteSettings;
  hero: HeroContent;
  whyVietnam: WhyVietnamItem[];
  whyChooseUs: Array<{ id: string; title: string; description: string; icon: string }>;
  coreService: CoreServiceItem;
  additionalServices: AdditionalServiceItem[];
  packages: PackageItem[];
  accommodations: AccommodationItem[];
  faqs: FAQItem[];
}

export async function fetchPublicContent(): Promise<PublicContentResponse> {
  return request<PublicContentResponse>('/api/public/content');
}

export async function fetchPublicFormFields(): Promise<InquiryFormField[]> {
  return request<InquiryFormField[]>('/api/public/form-fields');
}

export async function submitInquiry(payload: any): Promise<{ leadCode: string; message: string }> {
  return request<{ leadCode: string; message: string }>('/api/public/inquiry', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Auth API
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return request<{ user: User }>('/api/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Backend logout request returned error (handled gracefully):', err);
  } finally {
    clearAuthToken();
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<any> {
  const data = await request<any>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function updateUserProfile(fullName: string): Promise<User> {
  const data = await request<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ fullName }),
  });
  return data;
}

// Admin API
export async function fetchAdminAnalytics(): Promise<any> {
  return request<any>('/api/admin/analytics');
}

export async function fetchAdminLeads(params: {
  status?: string;
  city?: string;
  packageCode?: string;
  search?: string;
  priority?: string;
} = {}): Promise<{ total: number; leads: Lead[] }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.city) query.set('city', params.city);
  if (params.packageCode) query.set('packageCode', params.packageCode);
  if (params.search) query.set('search', params.search);
  if (params.priority) query.set('priority', params.priority);
  return request<{ total: number; leads: Lead[] }>(`/api/admin/leads?${query.toString()}`);
}

export async function fetchAdminLeadDetail(id: string): Promise<{ lead: Lead; notes: any[]; history: any[] }> {
  return request<{ lead: Lead; notes: any[]; history: any[] }>(`/api/admin/leads/${id}`);
}

export async function updateLeadStatus(id: string, status: string, note?: string, priority?: string): Promise<Lead> {
  return request<Lead>(`/api/admin/leads/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note, priority }),
  });
}

export async function addLeadNote(id: string, content: string): Promise<any> {
  return request<any>(`/api/admin/leads/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function assignLead(id: string, userId: string): Promise<Lead> {
  return request<Lead>(`/api/admin/leads/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ userId }),
  });
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  return request<SiteSettings>('/api/admin/settings');
}

export async function updateAdminSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  return request<SiteSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function fetchAdminHero(): Promise<HeroContent> {
  return request<HeroContent>('/api/admin/hero');
}

export async function updateAdminHero(hero: Partial<HeroContent>): Promise<HeroContent> {
  return request<HeroContent>('/api/admin/hero', {
    method: 'PUT',
    body: JSON.stringify(hero),
  });
}

export async function fetchAdminCoreService(): Promise<CoreServiceItem> {
  return request<CoreServiceItem>('/api/admin/core-service');
}

export async function updateAdminCoreService(service: Partial<CoreServiceItem>): Promise<CoreServiceItem> {
  return request<CoreServiceItem>('/api/admin/core-service', {
    method: 'PUT',
    body: JSON.stringify(service),
  });
}

export async function fetchAdminPackages(): Promise<PackageItem[]> {
  return request<PackageItem[]>('/api/admin/packages');
}

export async function saveAdminPackage(pkg: Partial<PackageItem>): Promise<PackageItem> {
  if (pkg.id) {
    return request<PackageItem>(`/api/admin/packages/${pkg.id}`, {
      method: 'PUT',
      body: JSON.stringify(pkg),
    });
  } else {
    return request<PackageItem>('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }
}

export async function deleteAdminPackage(id: string): Promise<any> {
  return request(`/api/admin/packages/${id}`, { method: 'DELETE' });
}

export async function fetchAdminAccommodations(): Promise<AccommodationItem[]> {
  return request<AccommodationItem[]>('/api/admin/accommodations');
}

export async function saveAdminAccommodation(acc: Partial<AccommodationItem>): Promise<AccommodationItem> {
  if (acc.id) {
    return request<AccommodationItem>(`/api/admin/accommodations/${acc.id}`, {
      method: 'PUT',
      body: JSON.stringify(acc),
    });
  } else {
    return request<AccommodationItem>('/api/admin/accommodations', {
      method: 'POST',
      body: JSON.stringify(acc),
    });
  }
}

export async function deleteAdminAccommodation(id: string): Promise<any> {
  return request(`/api/admin/accommodations/${id}`, { method: 'DELETE' });
}

export async function fetchAdminFaqs(): Promise<FAQItem[]> {
  return request<FAQItem[]>('/api/admin/faqs');
}

export async function saveAdminFaq(faq: Partial<FAQItem>): Promise<FAQItem> {
  if (faq.id) {
    return request<FAQItem>(`/api/admin/faqs/${faq.id}`, {
      method: 'PUT',
      body: JSON.stringify(faq),
    });
  } else {
    return request<FAQItem>('/api/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(faq),
    });
  }
}

export async function deleteAdminFaq(id: string): Promise<any> {
  return request(`/api/admin/faqs/${id}`, { method: 'DELETE' });
}

export async function fetchAdminFormFields(): Promise<InquiryFormField[]> {
  return request<InquiryFormField[]>('/api/admin/form-fields');
}

export async function updateAdminFormField(id: string, updates: Partial<InquiryFormField>): Promise<InquiryFormField> {
  return request<InquiryFormField>(`/api/admin/form-fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function fetchAdminEmailJobs(): Promise<EmailJob[]> {
  return request<EmailJob[]>('/api/admin/email-jobs');
}

export async function retryEmailJob(id: string): Promise<any> {
  return request(`/api/admin/email-jobs/${id}/retry`, { method: 'POST' });
}

export async function fetchAdminAuditLogs(): Promise<AuditLog[]> {
  return request<AuditLog[]>('/api/admin/audit-logs');
}

export async function fetchAdminMedia(): Promise<any[]> {
  return request<any[]>('/api/admin/media');
}

export async function uploadAdminMedia(media: any): Promise<any> {
  return request<any>('/api/admin/media', {
    method: 'POST',
    body: JSON.stringify(media),
  });
}

export async function deleteAdminMedia(id: string): Promise<any> {
  return request(`/api/admin/media/${id}`, { method: 'DELETE' });
}

export async function fetchAdminUsers(): Promise<User[]> {
  return request<User[]>('/api/auth/users');
}

export async function createAdminUser(userData: any): Promise<any> {
  return request<any>('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function toggleAdminUserStatus(id: string, isActive: boolean): Promise<any> {
  return request<any>(`/api/auth/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export async function resetAdminUserPassword(id: string, newPassword: string): Promise<any> {
  return request<any>(`/api/auth/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

export async function resetDemoData(): Promise<any> {
  return request<any>('/api/admin/system/reset-demo', { method: 'POST' });
}
