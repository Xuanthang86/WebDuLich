import { Router, Request, Response } from 'express';
import { db } from '../db/store';
import { authenticate, requireRole } from '../middleware/auth';
import { ExportService } from '../services/exportService';
import { EmailService } from '../services/emailService';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
router.get('/analytics', (_req: Request, res: Response): void => {
  const leads = db.getState().leads;
  const total = leads.length;
  const newCount = leads.filter(l => l.status === 'NEW').length;
  const contactedCount = leads.filter(l => l.status === 'CONTACTED').length;
  const qualifiedCount = leads.filter(l => l.status === 'QUALIFIED').length;
  const convertedCount = leads.filter(l => l.status === 'CONVERTED').length;
  const closedCount = leads.filter(l => l.status === 'CLOSED').length;

  const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : '0.0';

  // Packages breakdown
  const packageMap: Record<string, number> = {};
  leads.forEach(l => {
    const key = l.packageName || l.packageCode || 'Other';
    packageMap[key] = (packageMap[key] || 0) + 1;
  });

  // Cities breakdown
  const cityMap: Record<string, number> = {};
  leads.forEach(l => {
    const key = l.destinationCity || 'Other';
    cityMap[key] = (cityMap[key] || 0) + 1;
  });

  // Country breakdown
  const countryMap: Record<string, number> = {};
  leads.forEach(l => {
    const key = l.countryCode || 'Other';
    countryMap[key] = (countryMap[key] || 0) + 1;
  });

  res.json({
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
      countryDistribution: countryMap,
      recentLeads: leads.slice(0, 5),
    },
  });
});

// ==========================================
// 2. SITE SETTINGS & CONFIG
// ==========================================
router.get('/settings', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().siteSettings });
});

router.put('/settings', requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const current = db.getState().siteSettings;
  const updates = req.body;

  // Protect against overwriting id
  delete updates.id;

  Object.assign(current, updates, { updatedAt: new Date().toISOString() });
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'SETTINGS_UPDATED',
    entityType: 'SITE_SETTINGS',
    details: 'Administrator updated global site settings and contact parameters.',
    ipAddress: req.ip,
  });

  res.json({ success: true, data: current });
});

// ==========================================
// 3. CONTENT CMS - HERO & SECTIONS
// ==========================================
router.get('/hero', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().heroContent });
});

router.put('/hero', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const current = db.getState().heroContent;
  Object.assign(current, req.body);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'HERO_UPDATED',
    entityType: 'HERO_CONTENT',
    details: 'Hero messaging or media updated.',
    ipAddress: req.ip,
  });

  res.json({ success: true, data: current });
});

router.get('/core-service', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().coreService });
});

router.put('/core-service', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const current = db.getState().coreService;
  Object.assign(current, req.body, { updatedAt: new Date().toISOString() });
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CORE_SERVICE_UPDATED',
    entityType: 'SERVICE',
    details: 'Updated Core Inclusions and monthly pricing baseline.',
    ipAddress: req.ip,
  });

  res.json({ success: true, data: current });
});

// Core Service Inclusions (9 Baseline Cards)
router.get('/core-service/inclusions', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getCoreInclusions() });
});

router.post('/core-service/inclusions', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const inc = db.saveCoreInclusion(req.body);
  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CORE_INCLUSION_SAVED',
    entityType: 'SERVICE_INCLUSION',
    entityId: inc.id,
    details: `Saved core inclusion: ${inc.title}`,
  });
  res.json({ success: true, data: inc });
});

router.delete('/core-service/inclusions/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.deleteCoreInclusion(id);
  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CORE_INCLUSION_DELETED',
    entityType: 'SERVICE_INCLUSION',
    entityId: id,
    details: `Deleted core inclusion ID: ${id}`,
  });
  res.json({ success: true, message: 'Core inclusion deleted.' });
});

// Additional Services
router.get('/additional-services', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().additionalServices });
});

router.post('/additional-services', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newService = {
    id: `as_${Date.now()}`,
    ...req.body,
    displayOrder: db.getState().additionalServices.length + 1,
    isPublished: req.body.isPublished ?? true,
    updatedAt: new Date().toISOString(),
  };
  db.getState().additionalServices.push(newService);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'ADDITIONAL_SERVICE_CREATED',
    entityType: 'SERVICE',
    entityId: newService.id,
    details: `Created new service: ${newService.title}`,
  });

  res.json({ success: true, data: newService });
});

router.put('/additional-services/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = db.getState().additionalServices.find(s => s.id === id);
  if (!item) {
    res.status(404).json({ success: false, error: { message: 'Service not found.' } });
    return;
  }
  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  db.save();
  res.json({ success: true, data: item });
});

router.delete('/additional-services/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().additionalServices = db.getState().additionalServices.filter(s => s.id !== id);
  db.save();
  res.json({ success: true, message: 'Service deleted.' });
});

// ==========================================
// 3b. WHY VIETNAM (THE VIETNAM ADVANTAGE)
// ==========================================
router.get('/why-vietnam', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().whyVietnam });
});

router.post('/why-vietnam', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newItem = {
    id: `wv_${Date.now()}`,
    ...req.body,
    displayOrder: db.getState().whyVietnam.length + 1,
    isPublished: req.body.isPublished ?? true,
    updatedAt: new Date().toISOString(),
  };
  db.getState().whyVietnam.push(newItem);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'WHY_VIETNAM_CREATED',
    entityType: 'CONTENT',
    entityId: newItem.id,
    details: `Created Why Vietnam pillar: ${newItem.title}`,
  });

  res.json({ success: true, data: newItem });
});

router.put('/why-vietnam/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = db.getState().whyVietnam.find(w => w.id === id);
  if (!item) {
    res.status(404).json({ success: false, error: { message: 'Item not found.' } });
    return;
  }
  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'WHY_VIETNAM_UPDATED',
    entityType: 'CONTENT',
    entityId: item.id,
    details: `Updated Why Vietnam pillar: ${item.title}`,
  });

  res.json({ success: true, data: item });
});

router.delete('/why-vietnam/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().whyVietnam = db.getState().whyVietnam.filter(w => w.id !== id);
  db.save();
  res.json({ success: true, message: 'Why Vietnam item deleted.' });
});

// ==========================================
// 3c. WHY CHOOSE US (TRUST PILLARS)
// ==========================================
router.get('/why-choose-us', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().whyChooseUs });
});

router.post('/why-choose-us', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newItem = {
    id: `wcu_${Date.now()}`,
    ...req.body,
    displayOrder: db.getState().whyChooseUs.length + 1,
    isPublished: req.body.isPublished ?? true,
  };
  db.getState().whyChooseUs.push(newItem);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'WHY_CHOOSE_US_CREATED',
    entityType: 'CONTENT',
    entityId: newItem.id,
    details: `Created Trust Pillar: ${newItem.title}`,
  });

  res.json({ success: true, data: newItem });
});

router.put('/why-choose-us/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const item = db.getState().whyChooseUs.find(w => w.id === id);
  if (!item) {
    res.status(404).json({ success: false, error: { message: 'Item not found.' } });
    return;
  }
  Object.assign(item, req.body);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'WHY_CHOOSE_US_UPDATED',
    entityType: 'CONTENT',
    entityId: item.id,
    details: `Updated Trust Pillar: ${item.title}`,
  });

  res.json({ success: true, data: item });
});

router.delete('/why-choose-us/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().whyChooseUs = db.getState().whyChooseUs.filter(w => w.id !== id);
  db.save();
  res.json({ success: true, message: 'Trust pillar deleted.' });
});

// ==========================================
// 4. PACKAGES CRUD
// ==========================================
router.get('/packages', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().packages });
});

router.post('/packages', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newPkg = {
    id: `pkg_${Date.now()}`,
    ...req.body,
    inclusions: Array.isArray(req.body.inclusions) ? req.body.inclusions : [],
    exclusions: Array.isArray(req.body.exclusions) ? req.body.exclusions : [],
    displayOrder: db.getState().packages.length + 1,
    updatedAt: new Date().toISOString(),
  };
  db.getState().packages.push(newPkg);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'PACKAGE_CREATED',
    entityType: 'PACKAGE',
    entityId: newPkg.id,
    details: `Created new package: ${newPkg.title}`,
  });

  res.json({ success: true, data: newPkg });
});

router.put('/packages/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const pkg = db.getState().packages.find(p => p.id === id);
  if (!pkg) {
    res.status(404).json({ success: false, error: { message: 'Package not found.' } });
    return;
  }
  Object.assign(pkg, req.body, { updatedAt: new Date().toISOString() });
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'PACKAGE_UPDATED',
    entityType: 'PACKAGE',
    entityId: pkg.id,
    details: `Updated package: ${pkg.title}`,
  });

  res.json({ success: true, data: pkg });
});

router.delete('/packages/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const pkg = db.getState().packages.find(p => p.id === id);
  if (!pkg) {
    res.status(404).json({ success: false, error: { message: 'Package not found.' } });
    return;
  }

  // Soft or direct delete check: verify if referenced by leads
  const leadReferences = db.getState().leads.filter(l => l.packageCode === pkg.code);
  if (leadReferences.length > 0) {
    // Soft delete to protect relational history
    pkg.isPublished = false;
    db.save();
    res.json({
      success: true,
      message: `Package is referenced by ${leadReferences.length} historical leads; unpublished rather than destroyed to preserve integrity.`,
    });
    return;
  }

  db.getState().packages = db.getState().packages.filter(p => p.id !== id);
  db.save();
  res.json({ success: true, message: 'Package deleted.' });
});

// ==========================================
// 4b. DESTINATION HUBS (PROVINCES / CITIES)
// ==========================================
router.get('/hubs', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getDestinationHubs() });
});

router.post('/hubs', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { name, hubName, tagline, description, badgeClass, heroImage, displayOrder, isPublished } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: { message: 'City / Province name is required.' } });
    return;
  }
  const existing = db.getDestinationHubs().find(h => h.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, error: { message: `Destination Hub for "${name}" already exists.` } });
    return;
  }
  const created = db.createDestinationHub({
    name: name.trim(),
    hubName: hubName?.trim() || `${name.trim()} Sanctuary Hub`,
    tagline: tagline?.trim() || `Extended-stay and retirement residences in ${name.trim()}`,
    description: description?.trim() || `Premier retirement community in ${name.trim()}.`,
    badgeClass: badgeClass || 'bg-emerald-100 text-emerald-800 border-emerald-300',
    heroImage: heroImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    displayOrder: displayOrder || db.getDestinationHubs().length + 1,
    isPublished: isPublished !== undefined ? isPublished : true,
  });

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DESTINATION_HUB_CREATED',
    entityType: 'DESTINATION_HUB',
    entityId: created.id,
    details: `Created new Destination Hub for: ${created.name}`,
  });

  res.json({ success: true, data: created });
});

router.put('/hubs/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateDestinationHub(id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { message: 'Destination Hub not found.' } });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DESTINATION_HUB_UPDATED',
    entityType: 'DESTINATION_HUB',
    entityId: id,
    details: `Updated Destination Hub: ${updated.name}`,
  });

  res.json({ success: true, data: updated });
});

router.delete('/hubs/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const result = db.deleteDestinationHub(id);
  if (!result.success) {
    if (result.reason === 'LINKED_ACCOMMODATIONS') {
      res.status(400).json({
        success: false,
        error: {
          code: 'LINKED_ACCOMMODATIONS_EXIST',
          message: `Cannot delete Destination Hub: ${result.count} residence(s) (${result.accommodations?.join(', ')}) are located in this city. Please reassign or delete these accommodations first to prevent orphaned records.`,
        },
      });
      return;
    }
    res.status(404).json({ success: false, error: { message: 'Destination Hub not found.' } });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DESTINATION_HUB_DELETED',
    entityType: 'DESTINATION_HUB',
    entityId: id,
    details: `Deleted Destination Hub ID: ${id}`,
  });

  res.json({ success: true, message: 'Destination Hub deleted.' });
});

// ==========================================
// 5. ACCOMMODATIONS CRUD
// ==========================================
router.get('/accommodations', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().accommodations });
});

router.post('/accommodations', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newAcc = {
    id: `acc_${Date.now()}`,
    ...req.body,
    amenities: Array.isArray(req.body.amenities) ? req.body.amenities : [],
    images: Array.isArray(req.body.images) ? req.body.images : [],
    displayOrder: db.getState().accommodations.length + 1,
    isPublished: req.body.isPublished ?? true,
    updatedAt: new Date().toISOString(),
  };
  db.getState().accommodations.push(newAcc);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'ACCOMMODATION_CREATED',
    entityType: 'ACCOMMODATION',
    entityId: newAcc.id,
    details: `Created accommodation: ${newAcc.title} in ${newAcc.city}`,
  });

  res.json({ success: true, data: newAcc });
});

router.put('/accommodations/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const acc = db.getState().accommodations.find(a => a.id === id);
  if (!acc) {
    res.status(404).json({ success: false, error: { message: 'Accommodation not found.' } });
    return;
  }
  Object.assign(acc, req.body, { updatedAt: new Date().toISOString() });
  db.save();
  res.json({ success: true, data: acc });
});

router.delete('/accommodations/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().accommodations = db.getState().accommodations.filter(a => a.id !== id);
  db.save();
  res.json({ success: true, message: 'Accommodation removed.' });
});

// ==========================================
// 6. FAQS CRUD
// ==========================================
router.get('/faqs', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().faqs });
});

router.post('/faqs', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const newFaq = {
    id: `faq_${Date.now()}`,
    ...req.body,
    displayOrder: db.getState().faqs.length + 1,
    isPublished: true,
    updatedAt: new Date().toISOString(),
  };
  db.getState().faqs.push(newFaq);
  db.save();
  res.json({ success: true, data: newFaq });
});

router.put('/faqs/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const faq = db.getState().faqs.find(f => f.id === id);
  if (!faq) {
    res.status(404).json({ success: false, error: { message: 'FAQ not found.' } });
    return;
  }
  Object.assign(faq, req.body, { updatedAt: new Date().toISOString() });
  db.save();
  res.json({ success: true, data: faq });
});

router.delete('/faqs/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().faqs = db.getState().faqs.filter(f => f.id !== id);
  db.save();
  res.json({ success: true, message: 'FAQ deleted.' });
});

// ==========================================
// 7. DYNAMIC FORM BUILDER
// ==========================================
router.get('/form-fields', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getFormFields() });
});

router.put('/form-fields/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateFormField(id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: { message: 'Form field not found.' } });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'FORM_FIELD_UPDATED',
    entityType: 'FORM_BUILDER',
    entityId: id,
    details: `Updated questionnaire field: ${updated.label}`,
  });

  res.json({ success: true, data: updated });
});

router.post('/form-fields/reorder', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, error: { message: 'orderedIds array required' } });
    return;
  }

  const fields = db.getState().formFields;
  orderedIds.forEach((id, index) => {
    const f = fields.find(field => field.id === id);
    if (f) f.displayOrder = index + 1;
  });

  db.save();
  res.json({ success: true, data: db.getFormFields() });
});

// ==========================================
// 8. LEADS & INQUIRY MANAGEMENT
// ==========================================
router.get('/leads', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const { status, city, packageCode, search, priority } = req.query;
  let leads = db.getLeads();

  if (status && typeof status === 'string' && status !== 'ALL') {
    leads = leads.filter(l => l.status === status);
  }
  if (city && typeof city === 'string' && city !== 'ALL') {
    leads = leads.filter(l => l.destinationCity.includes(city));
  }
  if (packageCode && typeof packageCode === 'string' && packageCode !== 'ALL') {
    leads = leads.filter(l => l.packageCode === packageCode);
  }
  if (priority && typeof priority === 'string' && priority !== 'ALL') {
    leads = leads.filter(l => l.priority === priority);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    leads = leads.filter(
      l =>
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.leadCode.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: {
      total: leads.length,
      leads,
    },
  });
});

router.get('/leads/:id', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const lead = db.getLeadById(id);
  if (!lead) {
    res.status(404).json({ success: false, error: { message: 'Lead not found.' } });
    return;
  }

  const notes = db.getLeadNotes(id);
  const history = db.getLeadStatusHistory(id);

  res.json({
    success: true,
    data: {
      lead,
      notes,
      history,
    },
  });
});

router.put('/leads/:id/status', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, note, priority } = req.body;

  if (!status) {
    res.status(400).json({ success: false, error: { message: 'New status is required.' } });
    return;
  }

  const lead = db.updateLeadStatus(id, status, req.user!.id, req.user!.fullName, note);
  if (!lead) {
    res.status(404).json({ success: false, error: { message: 'Lead not found.' } });
    return;
  }

  if (priority) {
    lead.priority = priority;
    db.save();
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'LEAD_STATUS_CHANGED',
    entityType: 'LEAD',
    entityId: id,
    details: `Status changed to ${status}. Note: ${note || 'None'}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: lead });
});

router.post('/leads/:id/notes', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: { message: 'Note content cannot be empty.' } });
    return;
  }

  const note = db.addLeadNote(id, req.user!.id, req.user!.fullName, content.trim());

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'LEAD_NOTE_ADDED',
    entityType: 'LEAD',
    entityId: id,
    details: 'Internal concierge note recorded.',
  });

  res.json({ success: true, data: note });
});

router.put('/leads/:id/assign', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { userId } = req.body;

  const lead = db.getLeadById(id);
  if (!lead) {
    res.status(404).json({ success: false, error: { message: 'Lead not found.' } });
    return;
  }

  lead.assignedTo = userId;
  lead.updatedAt = new Date().toISOString();
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'LEAD_ASSIGNED',
    entityType: 'LEAD',
    entityId: id,
    details: `Assigned lead to staff user ID: ${userId}`,
  });

  res.json({ success: true, data: lead });
});

// ==========================================
// 9. EXPORTS (CSV & Excel)
// ==========================================
router.get('/export/csv', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const leads = db.getLeads();
  const csvData = ExportService.generateLeadsCsv(leads);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DATA_EXPORT_CSV',
    entityType: 'LEADS',
    details: `Exported ${leads.length} inquiry records to CSV.`,
    ipAddress: req.ip,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="wanderers_leads_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvData);
});

router.get('/export/excel', requireRole(['ADMIN', 'LEAD_MANAGER']), (req: Request, res: Response): void => {
  const leads = db.getLeads();
  const xmlData = ExportService.generateLeadsExcelXml(leads);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DATA_EXPORT_EXCEL',
    entityType: 'LEADS',
    details: `Exported ${leads.length} inquiry records to Excel XML.`,
    ipAddress: req.ip,
  });

  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="wanderers_leads_${new Date().toISOString().split('T')[0]}.xls"`);
  res.send(xmlData);
});

// ==========================================
// 10. EMAIL JOBS OUTBOX
// ==========================================
router.get('/email-jobs', requireRole(['ADMIN']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().emailJobs });
});

router.post('/email-jobs/:id/retry', requireRole(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const success = await EmailService.retryJob(id);
  res.json({ success, message: success ? 'Email retry sent.' : 'Email retry failed.' });
});

// ==========================================
// 11. AUDIT LOGS
// ==========================================
router.get('/audit-logs', requireRole(['ADMIN']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().auditLogs.slice(0, 100) });
});

// ==========================================
// 12. MEDIA ASSETS
// ==========================================
router.get('/media', requireRole(['ADMIN', 'MANAGER']), (_req: Request, res: Response): void => {
  res.json({ success: true, data: db.getState().mediaAssets });
});

router.post('/media', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { filename, url, altText, category, sizeBytes, mimeType } = req.body;
  if (!url || !filename) {
    res.status(400).json({ success: false, error: { message: 'Filename and URL are required.' } });
    return;
  }

  const asset = {
    id: `med_${Date.now()}`,
    filename,
    originalName: filename,
    mimeType: mimeType || 'image/jpeg',
    sizeBytes: sizeBytes || 250000,
    url,
    altText: altText || filename,
    category: category || 'general',
    createdAt: new Date().toISOString(),
  };

  db.getState().mediaAssets.unshift(asset);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'MEDIA_UPLOADED',
    entityType: 'MEDIA',
    entityId: asset.id,
    details: `Added media asset: ${asset.filename}`,
  });

  res.json({ success: true, data: asset });
});

router.delete('/media/:id', requireRole(['ADMIN', 'MANAGER']), (req: Request, res: Response): void => {
  const { id } = req.params;
  db.getState().mediaAssets = db.getState().mediaAssets.filter(m => m.id !== id);
  db.save();
  res.json({ success: true, message: 'Media removed.' });
});

// ==========================================
// 13. SYSTEM BACKUP & RESET
// ==========================================
router.get('/system/backup', requireRole(['ADMIN']), (_req: Request, res: Response): void => {
  const cleanState = JSON.parse(JSON.stringify(db.getState()));
  // strip sensitive password hashes for portable export
  cleanState.users = cleanState.users.map((u: any) => ({ ...u, passwordHash: '[REDACTED]' }));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="wanderers_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.json(cleanState);
});

router.post('/system/reset-demo', requireRole(['ADMIN']), (req: Request, res: Response): void => {
  db.resetToDefault();
  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'SYSTEM_RESET',
    entityType: 'SYSTEM',
    details: 'Database reset to initial turnkey demo state.',
    ipAddress: req.ip,
  });
  res.json({ success: true, message: 'Database reset to clean factory state.' });
});

export default router;
