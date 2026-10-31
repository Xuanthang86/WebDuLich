import fs from 'fs';
import path from 'path';
import { DatabaseState, Lead, LeadStatus, User, Session, AuditLog, InquiryFormField } from './schema';
import { INITIAL_DATABASE_STATE } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private state: DatabaseState;
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.state = this.loadDatabase();
  }

  private loadDatabase(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required top-level collections exist
        const mergedSiteSettings = {
          ...INITIAL_DATABASE_STATE.siteSettings,
          ...(parsed.siteSettings || {}),
          whyVietnamHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.whyVietnamHeader,
            ...(parsed.siteSettings?.whyVietnamHeader || {}),
          },
          financialProjection: {
            ...INITIAL_DATABASE_STATE.siteSettings.financialProjection,
            ...(parsed.siteSettings?.financialProjection || {}),
          },
          packagesHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.packagesHeader,
            ...(parsed.siteSettings?.packagesHeader || {}),
          },
          accommodationsHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.accommodationsHeader,
            ...(parsed.siteSettings?.accommodationsHeader || {}),
          },
          whyChooseUsHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.whyChooseUsHeader,
            ...(parsed.siteSettings?.whyChooseUsHeader || {}),
          },
          additionalServicesHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.additionalServicesHeader,
            ...(parsed.siteSettings?.additionalServicesHeader || {}),
          },
          faqsHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.faqsHeader,
            ...(parsed.siteSettings?.faqsHeader || {}),
          },
          inquiryHeader: {
            ...INITIAL_DATABASE_STATE.siteSettings.inquiryHeader,
            ...(parsed.siteSettings?.inquiryHeader || {}),
          },
        };

        const mergedHero = {
          ...INITIAL_DATABASE_STATE.heroContent,
          ...(parsed.heroContent || {}),
          valueBadges:
            parsed.heroContent?.valueBadges && parsed.heroContent.valueBadges.length > 0
              ? parsed.heroContent.valueBadges
              : INITIAL_DATABASE_STATE.heroContent.valueBadges,
        };

        const mergedCore = {
          ...INITIAL_DATABASE_STATE.coreService,
          ...(parsed.coreService || {}),
          inclusions:
            parsed.coreService?.inclusions && parsed.coreService.inclusions.length > 0
              ? parsed.coreService.inclusions
              : INITIAL_DATABASE_STATE.coreService.inclusions,
        };

        const mergedHubs =
          parsed.destinationHubs && parsed.destinationHubs.length > 0
            ? parsed.destinationHubs
            : INITIAL_DATABASE_STATE.destinationHubs;

        return {
          ...INITIAL_DATABASE_STATE,
          ...parsed,
          siteSettings: mergedSiteSettings,
          heroContent: mergedHero,
          coreService: mergedCore,
          destinationHubs: mergedHubs,
        };
      }
    } catch (err) {
      console.error('Error loading database from disk, falling back to seed data:', err);
    }

    // Default fallback to seed data
    const initial = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
    this.persistSync(initial);
    return initial;
  }

  private persistSync(data: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to sync write database:', e);
    }
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error saving database:', e);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // Users & Sessions
  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public createSession(session: Session): void {
    // Purge expired sessions
    const now = new Date().toISOString();
    this.state.sessions = this.state.sessions.filter(s => s.expiresAt > now);
    this.state.sessions.push(session);
    this.save();
  }

  public getSession(token: string): Session | undefined {
    const session = this.state.sessions.find(s => s.token === token);
    if (!session) return undefined;
    if (session.expiresAt <= new Date().toISOString()) {
      this.state.sessions = this.state.sessions.filter(s => s.token !== token);
      this.save();
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string): void {
    this.state.sessions = this.state.sessions.filter(s => s.token !== token);
    this.save();
  }

  public revokeUserSessions(userId: string): void {
    this.state.sessions = this.state.sessions.filter(s => s.userId !== userId);
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // Leads
  public createLead(data: Omit<Lead, 'id' | 'leadCode' | 'createdAt' | 'updatedAt'>): Lead {
    const now = new Date().toISOString();
    const count = this.state.leads.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const leadCode = `WJ-${new Date().getFullYear()}-${randomSuffix}`;
    const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newLead: Lead = {
      ...data,
      id,
      leadCode,
      createdAt: now,
      updatedAt: now,
    };

    this.state.leads.unshift(newLead);

    // Initial status history
    this.state.leadStatusHistory.push({
      id: `lsh_${Date.now()}`,
      leadId: id,
      oldStatus: 'NEW',
      newStatus: 'NEW',
      changedById: 'SYSTEM',
      changedByName: 'System Intake',
      note: 'Inquiry received via web questionnaire.',
      changedAt: now,
    });

    this.save();
    return newLead;
  }

  public getLeads(): Lead[] {
    return this.state.leads;
  }

  public getLeadById(id: string): Lead | undefined {
    return this.state.leads.find(l => l.id === id);
  }

  public updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    changedById: string,
    changedByName: string,
    note?: string
  ): Lead | null {
    const lead = this.getLeadById(leadId);
    if (!lead) return null;

    const oldStatus = lead.status;
    lead.status = newStatus;
    lead.updatedAt = new Date().toISOString();

    this.state.leadStatusHistory.push({
      id: `lsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      oldStatus,
      newStatus,
      changedById,
      changedByName,
      note,
      changedAt: lead.updatedAt,
    });

    this.save();
    return lead;
  }

  public addLeadNote(leadId: string, authorId: string, authorName: string, content: string) {
    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    this.state.leadNotes.push(note);
    this.save();
    return note;
  }

  public getLeadNotes(leadId: string) {
    return this.state.leadNotes
      .filter(n => n.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLeadStatusHistory(leadId: string) {
    return this.state.leadStatusHistory
      .filter(h => h.leadId === leadId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 2000) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 2000);
    }
    this.save();
  }

  // Dynamic Form Fields
  public getFormFields(): InquiryFormField[] {
    return this.state.formFields.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public updateFormField(id: string, updates: Partial<InquiryFormField>): InquiryFormField | null {
    const field = this.state.formFields.find(f => f.id === id);
    if (!field) return null;
    Object.assign(field, updates);
    this.save();
    return field;
  }

  // User deletion
  public deleteUser(id: string): boolean {
    const index = this.state.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.revokeUserSessions(id);
    this.state.users.splice(index, 1);
    this.save();
    return true;
  }

  // Destination Hubs
  public getDestinationHubs() {
    if (!this.state.destinationHubs) {
      this.state.destinationHubs = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE.destinationHubs || []));
    }
    return this.state.destinationHubs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public getDestinationHubById(id: string) {
    return this.getDestinationHubs().find(h => h.id === id);
  }

  public createDestinationHub(hub: any) {
    const hubs = this.getDestinationHubs();
    const newHub = {
      ...hub,
      id: hub.id || `hub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      displayOrder: hub.displayOrder || hubs.length + 1,
      isPublished: hub.isPublished !== undefined ? hub.isPublished : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.destinationHubs.push(newHub);
    this.save();
    return newHub;
  }

  public updateDestinationHub(id: string, updates: any) {
    const hub = this.getDestinationHubById(id);
    if (!hub) return null;
    Object.assign(hub, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return hub;
  }

  public deleteDestinationHub(id: string) {
    const hubs = this.getDestinationHubs();
    const hub = hubs.find(h => h.id === id);
    if (!hub) return { success: false, reason: 'NOT_FOUND' };

    // Check if accommodations reference this city
    const linkedAccs = this.state.accommodations.filter(
      a => a.city.toLowerCase() === hub.name.toLowerCase()
    );
    if (linkedAccs.length > 0) {
      return {
        success: false,
        reason: 'LINKED_ACCOMMODATIONS',
        count: linkedAccs.length,
        accommodations: linkedAccs.map(a => a.title),
      };
    }

    this.state.destinationHubs = this.state.destinationHubs.filter(h => h.id !== id);
    this.save();
    return { success: true };
  }

  // Core Service Inclusions
  public getCoreInclusions() {
    if (!this.state.coreService.inclusions || this.state.coreService.inclusions.length === 0) {
      this.state.coreService.inclusions = JSON.parse(
        JSON.stringify(INITIAL_DATABASE_STATE.coreService.inclusions || [])
      );
    }
    return (this.state.coreService.inclusions || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public saveCoreInclusion(data: any) {
    const inclusions = this.getCoreInclusions();
    if (data.id) {
      const idx = inclusions.findIndex(inc => inc.id === data.id);
      if (idx !== -1) {
        inclusions[idx] = { ...inclusions[idx], ...data };
        this.save();
        return inclusions[idx];
      }
    }
    const newInc = {
      id: data.id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title || 'Service Inclusion',
      description: data.description || '',
      icon: data.icon || 'Sparkles',
      bulletPoints: data.bulletPoints || [],
      displayOrder: data.displayOrder || inclusions.length + 1,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    };
    inclusions.push(newInc);
    this.save();
    return newInc;
  }

  public deleteCoreInclusion(id: string) {
    this.state.coreService.inclusions = this.getCoreInclusions().filter(i => i.id !== id);
    this.save();
    return true;
  }

  public resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
    this.save();
    return this.state;
  }
}

export const db = new DatabaseStore();
