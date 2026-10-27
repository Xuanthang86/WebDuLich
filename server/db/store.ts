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
        return {
          ...INITIAL_DATABASE_STATE,
          ...parsed,
          siteSettings: { ...INITIAL_DATABASE_STATE.siteSettings, ...(parsed.siteSettings || {}) },
          heroContent: { ...INITIAL_DATABASE_STATE.heroContent, ...(parsed.heroContent || {}) },
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

  public resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
    this.save();
    return this.state;
  }
}

export const db = new DatabaseStore();
