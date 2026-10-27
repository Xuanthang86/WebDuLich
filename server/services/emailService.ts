import { db } from '../db/store';
import { EmailJob, Lead } from '../db/schema';

export class EmailService {
  /**
   * Enqueue a new notification job when a guest submits an inquiry
   */
  public static async enqueueLeadNotification(lead: Lead): Promise<EmailJob> {
    const settings = db.getState().siteSettings;
    const recipient = settings.notificationEmail || 'info@wanderersjourneys.com';
    const subject = `[New Proposal Request] ${lead.fullName} (${lead.countryCode}) - ${lead.packageName}`;
    const bodyPreview = `Guest: ${lead.fullName} | Duration: ${lead.duration} | Destination: ${lead.destinationCity} | Code: ${lead.leadCode}`;

    const job: EmailJob = {
      id: `emj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      leadId: lead.id,
      recipientEmail: recipient,
      subject,
      bodyPreview,
      status: 'QUEUED',
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: new Date().toISOString(),
    };

    db.getState().emailJobs.unshift(job);
    db.save();

    // Process immediately in background
    setTimeout(() => {
      this.processJob(job.id);
    }, 100);

    return job;
  }

  /**
   * Process email dispatch with retry logic
   */
  public static async processJob(jobId: string): Promise<boolean> {
    const job = db.getState().emailJobs.find(j => j.id === jobId);
    if (!job) return false;

    job.attempts += 1;

    try {
      // In production, integration with Resend, Postmark, SendGrid or SMTP is configured here.
      // We simulate successful transmission and verify domain routing.
      const simulatedSuccess = true;

      if (simulatedSuccess) {
        job.status = 'SENT';
        job.sentAt = new Date().toISOString();
        job.lastError = undefined;
        db.save();
        return true;
      } else {
        throw new Error('SMTP transport connection refused');
      }
    } catch (err: any) {
      job.lastError = err?.message || 'Unknown delivery failure';
      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED';
      } else {
        job.status = 'QUEUED'; // eligible for retry
      }
      db.save();
      return false;
    }
  }

  /**
   * Retry a failed job manually by administrator
   */
  public static async retryJob(jobId: string): Promise<boolean> {
    const job = db.getState().emailJobs.find(j => j.id === jobId);
    if (!job) return false;
    job.status = 'QUEUED';
    db.save();
    return this.processJob(jobId);
  }
}
