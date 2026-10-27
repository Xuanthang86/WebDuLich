import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { rateLimitLeadSubmission, verifyHoneypot } from '../middleware/security';
import { EmailService } from '../services/emailService';

const router = Router();

// Public Content Bundle
router.get('/content', (_req: Request, res: Response): void => {
  const state = db.getState();

  res.json({
    success: true,
    data: {
      settings: {
        brandName: state.siteSettings.brandName,
        slogan: state.siteSettings.slogan,
        defaultSeoTitle: state.siteSettings.defaultSeoTitle,
        defaultSeoDescription: state.siteSettings.defaultSeoDescription,
        contactEmail: state.siteSettings.contactEmail,
        contactPhone: state.siteSettings.contactPhone,
        address: state.siteSettings.address,
        socialLinks: state.siteSettings.socialLinks,
        footerNote: state.siteSettings.footerNote,
        copyright: state.siteSettings.copyright,
        budgetComparisonMessage: state.siteSettings.budgetComparisonMessage,
      },
      hero: state.heroContent,
      whyVietnam: state.whyVietnam,
      whyChooseUs: state.whyChooseUs,
      coreService: state.coreService,
      additionalServices: state.additionalServices
        .filter(s => s.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      packages: state.packages
        .filter(p => p.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      accommodations: state.accommodations
        .filter(a => a.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),
      faqs: state.faqs
        .filter(f => f.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    },
  });
});

// Dynamic Inquiry Form Fields
router.get('/form-fields', (_req: Request, res: Response): void => {
  const fields = db
    .getState()
    .formFields.filter(f => f.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  res.json({ success: true, data: fields });
});

// Submit Inquiry / Lead
router.post(
  '/inquiry',
  rateLimitLeadSubmission,
  verifyHoneypot,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
        idempotencyKey,
      } = req.body;

      // Validation
      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Please provide your full name.' },
        });
        return;
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A valid email address is required.' },
        });
        return;
      }

      if (!consentAccepted) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONSENT_REQUIRED',
            message: 'You must agree to the privacy policy to submit an inquiry.',
          },
        });
        return;
      }

      // Idempotency check: check if an identical submission was received within 3 minutes
      const existingLeads = db.getState().leads;
      const recentDuplicate = existingLeads.find(l => {
        if (idempotencyKey && l.idempotencyKey === idempotencyKey) return true;
        const isSameEmail = l.email.toLowerCase() === email.toLowerCase();
        const diffMs = Date.now() - new Date(l.createdAt).getTime();
        return isSameEmail && diffMs < 180000 && l.duration === duration;
      });

      if (recentDuplicate) {
        res.status(200).json({
          success: true,
          data: {
            leadCode: recentDuplicate.leadCode,
            message: 'Your inquiry has already been received. Our concierge team is preparing your proposal.',
            isExisting: true,
          },
        });
        return;
      }

      // Create new lead in database
      const newLead = db.createLead({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? String(phone).trim() : '',
        countryCode: countryCode ? String(countryCode).trim() : 'International',
        expectedStartDate: expectedStartDate || '',
        duration: duration || 'Flexible',
        guestCount: guestCount ? parseInt(String(guestCount), 10) : 1,
        ageGroups: ageGroups || '',
        packageCode: packageCode || 'CUSTOM',
        packageName: packageName || packageCode || 'Custom Consultation',
        destinationCity: destinationCity || 'Flexible',
        preferredAccommodationType: preferredAccommodationType || 'Serviced Apartment',
        activities: Array.isArray(activities) ? activities : [],
        transportPreference: transportPreference || 'Standard',
        estimatedBudget: estimatedBudget || 'Standard',
        additionalNotes: additionalNotes ? String(additionalNotes).trim() : '',
        consentAccepted: true,
        status: 'NEW',
        priority: 'MEDIUM',
        source: 'Website Inquiry Form',
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        idempotencyKey: idempotencyKey || undefined,
      });

      // Audit Log
      db.addAuditLog({
        userId: 'SYSTEM',
        userEmail: 'system@wanderersjourneys.com',
        action: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: newLead.id,
        details: `Inquiry submitted by ${newLead.fullName} (${newLead.email}) for ${newLead.packageName}.`,
        ipAddress: req.ip,
      });

      // Dispatch Email Notification Outbox
      await EmailService.enqueueLeadNotification(newLead);

      res.status(201).json({
        success: true,
        data: {
          leadCode: newLead.leadCode,
          message: 'Thank you! Your retirement proposal request has been received. Our senior concierge will contact you within 24 hours.',
        },
      });
    } catch (err: any) {
      console.error('Error submitting inquiry:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred while processing your request.' },
      });
    }
  }
);

// Health Check API
router.get('/health', (_req: Request, res: Response): void => {
  const state = db.getState();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    app: "Wanderer's Journeys Fullstack System",
    metrics: {
      uptimeSeconds: Math.floor(process.uptime()),
      totalLeads: state.leads.length,
      activeUsers: state.users.filter(u => u.isActive).length,
      packagesCount: state.packages.length,
      accommodationsCount: state.accommodations.length,
      pendingEmails: state.emailJobs.filter(j => j.status === 'QUEUED').length,
    },
  });
});

export default router;
