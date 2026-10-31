import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Home,
  Package,
  Building,
  HelpCircle,
  Plus,
  Save,
  Trash2,
  Check,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Compass,
  HeartHandshake,
  Layers,
  Inbox,
  ArrowUpRight,
} from 'lucide-react';
import {
  fetchAdminHero,
  updateAdminHero,
  fetchAdminWhyVietnam,
  saveAdminWhyVietnam,
  deleteAdminWhyVietnam,
  fetchAdminCoreService,
  updateAdminCoreService,
  fetchAdminAdditionalServices,
  saveAdminAdditionalServices,
  deleteAdminAdditionalServices,
  fetchAdminPackages,
  saveAdminPackage,
  deleteAdminPackage,
  fetchAdminAccommodations,
  saveAdminAccommodation,
  deleteAdminAccommodation,
  fetchAdminWhyChooseUs,
  saveAdminWhyChooseUs,
  deleteAdminWhyChooseUs,
  fetchAdminFaqs,
  saveAdminFaq,
  deleteAdminFaq,
} from '../../api';
import {
  HeroContent,
  WhyVietnamItem,
  CoreServiceItem,
  AdditionalServiceItem,
  PackageItem,
  AccommodationItem,
  WhyChooseUsItem,
  FAQItem,
} from '../../types';

type CmsTab =
  | 'hero'
  | 'whyVietnam'
  | 'core'
  | 'additionalServices'
  | 'packages'
  | 'accommodations'
  | 'whyChooseUs'
  | 'faqs';

export const AdminContentCms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CmsTab>('hero');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Loading and Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Content Data
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [whyVietnamList, setWhyVietnamList] = useState<WhyVietnamItem[]>([]);
  const [core, setCore] = useState<CoreServiceItem | null>(null);
  const [additionalServices, setAdditionalServices] = useState<AdditionalServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [whyChooseUsList, setWhyChooseUsList] = useState<WhyChooseUsItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Item Edit Forms
  const [editingWhyVietnam, setEditingWhyVietnam] = useState<Partial<WhyVietnamItem> | null>(null);
  const [editingAdditionalService, setEditingAdditionalService] = useState<Partial<AdditionalServiceItem> | null>(null);
  const [editingPkg, setEditingPkg] = useState<Partial<PackageItem> | null>(null);
  const [editingAcc, setEditingAcc] = useState<Partial<AccommodationItem> | null>(null);
  const [editingWhyChooseUs, setEditingWhyChooseUs] = useState<Partial<WhyChooseUsItem> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);

  // Custom Deletion Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'whyVietnam' | 'additionalService' | 'package' | 'accommodation' | 'whyChooseUs' | 'faq';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const triggerSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const loadAllContent = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const results = await Promise.allSettled([
        fetchAdminHero(),
        fetchAdminWhyVietnam(),
        fetchAdminCoreService(),
        fetchAdminAdditionalServices(),
        fetchAdminPackages(),
        fetchAdminAccommodations(),
        fetchAdminWhyChooseUs(),
        fetchAdminFaqs(),
      ]);
      const failedSections: string[] = [];
      const read = <T,>(index: number, label: string): T | undefined => {
        const result = results[index];
        if (result.status === 'fulfilled') return result.value as T;
        failedSections.push(label);
        console.error(`Failed to load CMS section "${label}":`, result.reason);
        return undefined;
      };

      const heroData = read<HeroContent>(0, 'Hero');
      const wvData = read<WhyVietnamItem[]>(1, 'Why Vietnam');
      const coreData = read<CoreServiceItem>(2, 'Core Service');
      const addlData = read<AdditionalServiceItem[]>(3, 'Additional Services');
      const pkgsData = read<PackageItem[]>(4, 'Packages');
      const accsData = read<AccommodationItem[]>(5, 'Accommodations');
      const wcuData = read<WhyChooseUsItem[]>(6, 'Why Choose Us');
      const faqsData = read<FAQItem[]>(7, 'FAQs');

      if (heroData !== undefined) setHero(heroData);
      if (wvData !== undefined) setWhyVietnamList(wvData);
      if (coreData !== undefined) setCore(coreData);
      if (addlData !== undefined) setAdditionalServices(addlData);
      if (pkgsData !== undefined) setPackages(pkgsData);
      if (accsData !== undefined) setAccommodations(accsData);
      if (wcuData !== undefined) setWhyChooseUsList(wcuData);
      if (faqsData !== undefined) setFaqs(faqsData);

      setErrorMsg(failedSections.length
        ? `Some CMS sections could not be loaded: ${failedSections.join(', ')}. Existing data has been preserved. Use Retry Connection after checking the API/database.`
        : null);
    } catch (err: any) {
      console.error('Failed to load CMS content:', err);
      setErrorMsg(err.message || 'Unable to connect to content store. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  // 1. Save Hero
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero) return;
    setIsSaving(true);
    try {
      const res = await updateAdminHero(hero);
      setHero(res);
      triggerSaveNotification('Hero section headline and copy updated successfully.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving hero: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Save Why Vietnam Item
  const handleSaveWhyVietnam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhyVietnam) return;
    setIsSaving(true);
    try {
      await saveAdminWhyVietnam(editingWhyVietnam);
      const refreshed = await fetchAdminWhyVietnam();
      setWhyVietnamList(refreshed);
      setEditingWhyVietnam(null);
      triggerSaveNotification('Vietnam Advantage pillar saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving item: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Save Core Service
  const handleSaveCore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!core) return;
    setIsSaving(true);
    try {
      const res = await updateAdminCoreService(core);
      setCore(res);
      triggerSaveNotification('Core living package inclusions saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving core service: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Save Additional Service
  const handleSaveAdditionalService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdditionalService) return;
    setIsSaving(true);
    try {
      await saveAdminAdditionalServices(editingAdditionalService);
      const refreshed = await fetchAdminAdditionalServices();
      setAdditionalServices(refreshed);
      setEditingAdditionalService(null);
      triggerSaveNotification('Additional service saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving service: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Save Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    setIsSaving(true);
    try {
      await saveAdminPackage(editingPkg);
      const refreshed = await fetchAdminPackages();
      setPackages(refreshed);
      setEditingPkg(null);
      triggerSaveNotification('Living package saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving package: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Save Accommodation
  const handleSaveAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc) return;
    setIsSaving(true);
    try {
      await saveAdminAccommodation(editingAcc);
      const refreshed = await fetchAdminAccommodations();
      setAccommodations(refreshed);
      setEditingAcc(null);
      triggerSaveNotification('Residence saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving residence: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Save Why Choose Us
  const handleSaveWhyChooseUs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhyChooseUs) return;
    setIsSaving(true);
    try {
      await saveAdminWhyChooseUs(editingWhyChooseUs);
      const refreshed = await fetchAdminWhyChooseUs();
      setWhyChooseUsList(refreshed);
      setEditingWhyChooseUs(null);
      triggerSaveNotification('Trust pillar saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving trust pillar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Save FAQ
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    setIsSaving(true);
    try {
      await saveAdminFaq(editingFaq);
      const refreshed = await fetchAdminFaqs();
      setFaqs(refreshed);
      setEditingFaq(null);
      triggerSaveNotification('FAQ saved.');
    } catch (err: any) {
      triggerSaveNotification(`Error saving FAQ: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Unified Deletion Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      switch (deleteTarget.type) {
        case 'whyVietnam':
          await deleteAdminWhyVietnam(deleteTarget.id);
          setWhyVietnamList(await fetchAdminWhyVietnam());
          triggerSaveNotification('Vietnam Advantage pillar removed.');
          break;
        case 'additionalService':
          await deleteAdminAdditionalServices(deleteTarget.id);
          setAdditionalServices(await fetchAdminAdditionalServices());
          triggerSaveNotification('Service removed.');
          break;
        case 'package':
          await deleteAdminPackage(deleteTarget.id);
          setPackages(await fetchAdminPackages());
          triggerSaveNotification('Living package removed.');
          break;
        case 'accommodation':
          await deleteAdminAccommodation(deleteTarget.id);
          setAccommodations(await fetchAdminAccommodations());
          triggerSaveNotification('Residence removed.');
          break;
        case 'whyChooseUs':
          await deleteAdminWhyChooseUs(deleteTarget.id);
          setWhyChooseUsList(await fetchAdminWhyChooseUs());
          triggerSaveNotification('Trust pillar removed.');
          break;
        case 'faq':
          await deleteAdminFaq(deleteTarget.id);
          setFaqs(await fetchAdminFaqs());
          triggerSaveNotification('FAQ removed.');
          break;
      }
    } catch (err: any) {
      triggerSaveNotification(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const tabsConfig = [
    { id: 'hero' as CmsTab, label: 'Hero Headline & Media', icon: Sparkles, count: null },
    { id: 'whyVietnam' as CmsTab, label: 'Vietnam Advantage', icon: Compass, count: whyVietnamList.length },
    { id: 'core' as CmsTab, label: 'Core Inclusions', icon: Home, count: null },
    { id: 'additionalServices' as CmsTab, label: 'Additional Services', icon: Layers, count: additionalServices.length },
    { id: 'packages' as CmsTab, label: 'Living Packages', icon: Package, count: packages.length },
    { id: 'accommodations' as CmsTab, label: 'Residences Showcase', icon: Building, count: accommodations.length },
    { id: 'whyChooseUs' as CmsTab, label: 'Trust Pillars', icon: HeartHandshake, count: whyChooseUsList.length },
    { id: 'faqs' as CmsTab, label: 'FAQs', icon: HelpCircle, count: faqs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Content CMS Manager</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Modify text messaging, living packages, pricing, coastal residences, and FAQs in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{saveStatus}</span>
            </div>
          )}

          <button
            type="button"
            onClick={loadAllContent}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reload content from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner if initial fetch failed */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadAllContent}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A45C]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-[#C9A45C] text-[#0F172A]' : 'bg-stone-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-[#C9A45C]/30 border-t-[#C9A45C] animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Retrieving section records from database...</p>
        </div>
      )}

      {/* =========================================================================
          TAB 1: HERO HEADLINE & MEDIA
          ========================================================================= */}
      {!loading && activeTab === 'hero' && (
        hero ? (
          <form onSubmit={handleSaveHero} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0F172A]">Hero Headline & Brand Messaging</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Homepage primary billboard and introductory positioning.</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Hero Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={hero.headline}
                  onChange={e => setHero({ ...hero, headline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-serif font-bold focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slogan Tagline</label>
                <input
                  type="text"
                  value={hero.tagline}
                  onChange={e => setHero({ ...hero, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={hero.badgeText}
                  onChange={e => setHero({ ...hero, badgeText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Introduction Subtext (WRC Model)</label>
                <textarea
                  rows={3}
                  value={hero.subtext}
                  onChange={e => setHero({ ...hero, subtext: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="font-bold text-slate-700 block">Hero Background Image</label>
                {hero.backgroundImageUrl && (
                  <div className="relative h-44 rounded-xl overflow-hidden border border-stone-200">
                    <img src={hero.backgroundImageUrl} alt="Hero Background" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#C9A45C] bg-[#FDFBF7] hover:bg-[#F7F3EA] text-xs font-semibold text-[#0F172A] cursor-pointer">
                      <Upload className="w-4 h-4 text-[#C9A45C]" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = evt => {
                              setHero({ ...hero, backgroundImageUrl: evt.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Or paste direct image URL..."
                      value={hero.backgroundImageUrl?.startsWith('data:') ? '' : hero.backgroundImageUrl}
                      onChange={e => setHero({ ...hero, backgroundImageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
            <p className="text-xs text-slate-500 mb-3">No hero configuration record found.</p>
            <button
              onClick={loadAllContent}
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold"
            >
              Reload Hero Data
            </button>
          </div>
        )
      )}

      {/* =========================================================================
          TAB 2: THE VIETNAM ADVANTAGE (WHY VIETNAM)
          ========================================================================= */}
      {!loading && activeTab === 'whyVietnam' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">The Vietnam Advantage ({whyVietnamList.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Value proposition pillars displayed on the homepage.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingWhyVietnam({
                  title: '',
                  description: '',
                  highlight: '',
                  icon: 'PiggyBank',
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add Advantage Pillar</span>
            </button>
          </div>

          {editingWhyVietnam && (
            <form onSubmit={handleSaveWhyVietnam} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingWhyVietnam.id ? 'Edit Advantage Pillar' : 'Create Advantage Pillar'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editingWhyVietnam.title || ''}
                    onChange={e => setEditingWhyVietnam({ ...editingWhyVietnam, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Lucide Icon Name</label>
                  <select
                    value={editingWhyVietnam.icon || 'PiggyBank'}
                    onChange={e => setEditingWhyVietnam({ ...editingWhyVietnam, icon: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="PiggyBank">PiggyBank (Cost of Living)</option>
                    <option value="SunMedium">SunMedium (Tropical Climate)</option>
                    <option value="HeartHandshake">HeartHandshake (Warm Hospitality)</option>
                    <option value="ShieldCheck">ShieldCheck (Modern Healthcare & Safety)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editingWhyVietnam.description || ''}
                    onChange={e => setEditingWhyVietnam({ ...editingWhyVietnam, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Highlight Metric / Badge (e.g. 50-65% lower expenses)</label>
                  <input
                    type="text"
                    value={editingWhyVietnam.highlight || ''}
                    onChange={e => setEditingWhyVietnam({ ...editingWhyVietnam, highlight: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWhyVietnam(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Pillar
                </button>
              </div>
            </form>
          )}

          {whyVietnamList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No pillars found. Click "Add Advantage Pillar" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyVietnamList.map(item => (
                <div key={item.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#0F172A]">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-slate-600">
                        {item.icon}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{item.description}</p>
                    {item.highlight && (
                      <div className="text-[11px] font-semibold text-[#A77A32] mt-2">
                        Key Metric: {item.highlight}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingWhyVietnam(item)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-xs font-medium text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'whyVietnam', id: item.id, title: item.title })}
                      className="p-2 rounded-lg hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                      title="Delete pillar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: CORE INCLUSIONS
          ========================================================================= */}
      {!loading && activeTab === 'core' && (
        core ? (
          <form onSubmit={handleSaveCore} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#0F172A]">Core Living Package Inclusions</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Baseline all-inclusive amenities and services bundled into all stays.</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Inclusions'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={core.title}
                  onChange={e => setCore({ ...core, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Starting Baseline (USD)</label>
                <input
                  type="number"
                  required
                  value={core.monthlyStartingPrice}
                  onChange={e => setCore({ ...core, monthlyStartingPrice: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Overview Description</label>
                <textarea
                  rows={2}
                  value={core.description}
                  onChange={e => setCore({ ...core, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Utility Credit Allowance Note</label>
                <input
                  type="text"
                  value={core.utilityAllowanceNote}
                  onChange={e => setCore({ ...core, utilityAllowanceNote: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Housekeeping Schedule</label>
                <input
                  type="text"
                  value={core.cleaningSchedule}
                  onChange={e => setCore({ ...core, cleaningSchedule: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Internet Speed Specification</label>
                <input
                  type="text"
                  value={core.internetSpeed}
                  onChange={e => setCore({ ...core, internetSpeed: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Personal Assistant / Concierge Details</label>
                <input
                  type="text"
                  value={core.personalAssistant}
                  onChange={e => setCore({ ...core, personalAssistant: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
            <p className="text-xs text-slate-500 mb-3">No core inclusions data loaded.</p>
            <button
              onClick={loadAllContent}
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold"
            >
              Reload Inclusions
            </button>
          </div>
        )
      )}

      {/* =========================================================================
          TAB 4: ADDITIONAL SERVICES
          ========================================================================= */}
      {!loading && activeTab === 'additionalServices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Additional Concierge Services ({additionalServices.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Specialized in-home healthcare, private chefs, chauffeurs, and tours.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingAdditionalService({
                  title: '',
                  description: '',
                  priceLabel: 'From $45 / visit',
                  category: 'Healthcare & Wellness',
                  icon: 'Stethoscope',
                  conditions: 'Arranged via licensed accredited partners.',
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add Service</span>
            </button>
          </div>

          {editingAdditionalService && (
            <form onSubmit={handleSaveAdditionalService} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingAdditionalService.id ? 'Edit Additional Service' : 'Add New Service'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Service Title</label>
                  <input
                    type="text"
                    required
                    value={editingAdditionalService.title || ''}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Pricing Label</label>
                  <input
                    type="text"
                    value={editingAdditionalService.priceLabel || ''}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, priceLabel: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingAdditionalService.category || 'Healthcare & Wellness'}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Lucide Icon Name</label>
                  <input
                    type="text"
                    value={editingAdditionalService.icon || 'Sparkles'}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, icon: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Service Description</label>
                  <textarea
                    rows={2}
                    value={editingAdditionalService.description || ''}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Conditions / Provider Note</label>
                  <input
                    type="text"
                    value={editingAdditionalService.conditions || ''}
                    onChange={e => setEditingAdditionalService({ ...editingAdditionalService, conditions: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdditionalService(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Service
                </button>
              </div>
            </form>
          )}

          {additionalServices.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No additional services registered. Click "Add Service" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalServices.map(svc => (
                <div key={svc.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-[#A77A32] uppercase tracking-wider">{svc.category}</div>
                    <div className="font-bold text-sm text-[#0F172A] mt-0.5">{svc.title}</div>
                    <div className="text-xs text-[#C9A45C] font-semibold mt-1">{svc.priceLabel}</div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingAdditionalService(svc)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-xs font-medium text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'additionalService', id: svc.id, title: svc.title })}
                      className="p-2 rounded-lg hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                      title="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: LIVING PACKAGES
          ========================================================================= */}
      {!loading && activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Living Packages Catalog ({packages.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Exploratory stays, Snowbird seasonal retreats, and annual retirement options.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingPkg({
                  title: '',
                  code: `PKG_${Date.now()}`,
                  tag: 'Living Package',
                  duration: '30 Days',
                  priceRange: '$2,300 / month',
                  summary: '',
                  inclusions: ['Furnished residence', 'Housekeeping', 'Concierge support'],
                  exclusions: ['Airfare'],
                  imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                  isFeatured: false,
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add Package</span>
            </button>
          </div>

          {editingPkg && (
            <form onSubmit={handleSavePackage} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingPkg.id ? 'Edit Living Package' : 'Create Living Package'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Package Title</label>
                  <input
                    type="text"
                    required
                    value={editingPkg.title || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tag / Subheading</label>
                  <input
                    type="text"
                    value={editingPkg.tag || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, tag: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Duration Label</label>
                  <input
                    type="text"
                    value={editingPkg.duration || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, duration: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Price Range Label</label>
                  <input
                    type="text"
                    value={editingPkg.priceRange || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, priceRange: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Summary Description</label>
                  <textarea
                    rows={2}
                    value={editingPkg.summary || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, summary: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-semibold block">Cover Image URL / Upload</label>
                  {editingPkg.imageUrl && (
                    <div className="h-36 rounded-xl overflow-hidden border border-stone-200">
                      <img src={editingPkg.imageUrl} alt="Package" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#C9A45C] bg-white hover:bg-stone-50 font-semibold cursor-pointer">
                        <Upload className="w-4 h-4 text-[#C9A45C]" />
                        <span>Choose Photo...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = evt => {
                                setEditingPkg({ ...editingPkg, imageUrl: evt.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Or enter image URL..."
                        value={editingPkg.imageUrl?.startsWith('data:') ? '' : (editingPkg.imageUrl || '')}
                        onChange={e => setEditingPkg({ ...editingPkg, imageUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPkg.isFeatured || false}
                      onChange={e => setEditingPkg({ ...editingPkg, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A45C] accent-[#C9A45C]"
                    />
                    <span className="font-semibold">Featured Badge Highlight</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPkg.isPublished ?? true}
                      onChange={e => setEditingPkg({ ...editingPkg, isPublished: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C9A45C] accent-[#C9A45C]"
                    />
                    <span className="font-semibold">Published on Website</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Package
                </button>
              </div>
            </form>
          )}

          {packages.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No living packages catalog records found. Click "Add Package" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#0F172A]">{pkg.title}</span>
                      {pkg.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C9A45C] text-[#0F172A]">
                          Featured
                        </span>
                      )}
                      {!pkg.isPublished && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-slate-500">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#A77A32] font-semibold">{pkg.priceRange} • {pkg.duration}</div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{pkg.summary}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingPkg(pkg)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-xs font-medium text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'package', id: pkg.id, title: pkg.title })}
                      className="p-2 rounded-lg hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                      title="Delete package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: RESIDENCES SHOWCASE
          ========================================================================= */}
      {!loading && activeTab === 'accommodations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Residences Showcase ({accommodations.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Beachfront suites, riverside apartments, and serviced villas.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingAcc({
                  title: '',
                  city: 'Da Nang',
                  district: 'My Khe Beachside',
                  bedrooms: 2,
                  bathrooms: 2,
                  priceMonthUsd: 2300,
                  description: 'Turnkey beachfront sanctuary with ocean balcony and pool access.',
                  amenities: ['Ocean View', 'Infinity Pool', 'Elevator', '24/7 Concierge'],
                  images: [
                    {
                      id: `img_${Date.now()}`,
                      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                      caption: 'Living room overlooking ocean',
                      isPrimary: true,
                    },
                  ],
                  displayOrder: 1,
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add Residence</span>
            </button>
          </div>

          {editingAcc && (
            <form onSubmit={handleSaveAccommodation} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingAcc.id ? 'Edit Residence' : 'Add Residence'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Residence Title</label>
                  <input
                    type="text"
                    required
                    value={editingAcc.title || ''}
                    onChange={e => setEditingAcc({ ...editingAcc, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Destination Hub City</label>
                  <select
                    value={editingAcc.city || 'Da Nang'}
                    onChange={e => setEditingAcc({ ...editingAcc, city: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Da Nang">Da Nang</option>
                    <option value="Nha Trang">Nha Trang</option>
                    <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">District / Neighborhood</label>
                  <input
                    type="text"
                    value={editingAcc.district || ''}
                    onChange={e => setEditingAcc({ ...editingAcc, district: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Bedrooms / Baths</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingAcc.bedrooms || 2}
                      onChange={e => setEditingAcc({ ...editingAcc, bedrooms: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                      placeholder="Beds"
                    />
                    <input
                      type="number"
                      value={editingAcc.bathrooms || 2}
                      onChange={e => setEditingAcc({ ...editingAcc, bathrooms: parseInt(e.target.value, 10) })}
                      className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                      placeholder="Baths"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Monthly USD Price</label>
                  <input
                    type="number"
                    value={editingAcc.priceMonthUsd || 2250}
                    onChange={e => setEditingAcc({ ...editingAcc, priceMonthUsd: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-semibold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingAcc.description || ''}
                    onChange={e => setEditingAcc({ ...editingAcc, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-3 space-y-2">
                  <label className="font-semibold block text-slate-700">Primary Residence Photo</label>
                  {editingAcc.images?.[0]?.url && (
                    <div className="relative rounded-xl overflow-hidden h-44 bg-slate-900 border border-stone-200">
                      <img src={editingAcc.images[0].url} alt="Residence" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#C9A45C] bg-white hover:bg-stone-50 font-semibold cursor-pointer">
                        <Upload className="w-4 h-4 text-[#C9A45C]" />
                        <span>Upload Image File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = evt => {
                                setEditingAcc({
                                  ...editingAcc,
                                  images: [
                                    {
                                      id: `img_${Date.now()}`,
                                      url: evt.target?.result as string,
                                      caption: file.name,
                                      isPrimary: true,
                                    },
                                  ],
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Or enter image URL..."
                        value={editingAcc.images?.[0]?.url?.startsWith('data:') ? '' : (editingAcc.images?.[0]?.url || '')}
                        onChange={e =>
                          setEditingAcc({
                            ...editingAcc,
                            images: [
                              {
                                id: 'img_primary',
                                url: e.target.value,
                                caption: editingAcc.title || 'Residence Showcase',
                                isPrimary: true,
                              },
                            ],
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Residence
                </button>
              </div>
            </form>
          )}

          {accommodations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No residences registered. Click "Add Residence" to create one.
            </div>
          ) : (
            <div className="space-y-6">
              {(['Da Nang', 'Nha Trang', 'Ho Chi Minh City'] as const).map(city => {
                const cityAccs = accommodations.filter(a => a.city === city);
                if (cityAccs.length === 0) return null;
                return (
                  <div key={city} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                      <span className="font-serif font-bold text-base text-[#0F172A]">{city}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 font-semibold text-slate-600">
                        {cityAccs.length} Units
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cityAccs.map(acc => (
                        <div key={acc.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
                          <div className="relative h-36 bg-stone-100">
                            {acc.images?.[0]?.url && (
                              <img src={acc.images[0].url} alt={acc.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-4 flex-1">
                            <div className="text-[10px] font-bold text-[#A77A32] uppercase">{acc.city}</div>
                            <h4 className="font-serif font-bold text-sm text-[#0F172A] mt-0.5">{acc.title}</h4>
                            <div className="text-xs text-slate-500 mt-1">{acc.district}</div>
                            <div className="text-sm font-bold text-[#0F172A] mt-2">${acc.priceMonthUsd} / month</div>
                          </div>
                          <div className="p-3 border-t border-stone-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setEditingAcc(acc)}
                              className="font-bold text-blue-700 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'accommodation', id: acc.id, title: acc.title })}
                              className="font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 7: TRUST PILLARS (WHY CHOOSE US)
          ========================================================================= */}
      {!loading && activeTab === 'whyChooseUs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Why Choose Us / Trust Pillars ({whyChooseUsList.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Concierge care, turnkey billing, and expat community guarantees.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingWhyChooseUs({
                  title: '',
                  description: '',
                  icon: 'Compass',
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add Trust Pillar</span>
            </button>
          </div>

          {editingWhyChooseUs && (
            <form onSubmit={handleSaveWhyChooseUs} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingWhyChooseUs.id ? 'Edit Trust Pillar' : 'Create Trust Pillar'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editingWhyChooseUs.title || ''}
                    onChange={e => setEditingWhyChooseUs({ ...editingWhyChooseUs, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Lucide Icon Name</label>
                  <input
                    type="text"
                    value={editingWhyChooseUs.icon || 'Compass'}
                    onChange={e => setEditingWhyChooseUs({ ...editingWhyChooseUs, icon: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={editingWhyChooseUs.description || ''}
                    onChange={e => setEditingWhyChooseUs({ ...editingWhyChooseUs, description: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWhyChooseUs(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Pillar
                </button>
              </div>
            </form>
          )}

          {whyChooseUsList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No trust pillars registered. Click "Add Trust Pillar" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyChooseUsList.map(item => (
                <div key={item.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-[#0F172A]">{item.title}</div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    <span className="inline-block text-[10px] font-mono text-slate-400 mt-2">
                      Icon: {item.icon}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingWhyChooseUs(item)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-xs font-medium text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'whyChooseUs', id: item.id, title: item.title })}
                      className="p-2 rounded-lg hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                      title="Delete pillar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 8: FAQS
          ========================================================================= */}
      {!loading && activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Frequently Asked Questions ({faqs.length})</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Visas, healthcare, banking, lease terms, and utilities.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingFaq({
                  category: 'General',
                  question: '',
                  answer: '',
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add FAQ</span>
            </button>
          </div>

          {editingFaq && (
            <form onSubmit={handleSaveFaq} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4 text-xs">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingFaq.id ? 'Edit FAQ' : 'Add New FAQ'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={editingFaq.category || 'General'}
                    onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Visa & Legal">Visa & Legal</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Finance">Finance</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={editingFaq.question || ''}
                    onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-semibold block mb-1">Detailed Answer</label>
                  <textarea
                    rows={4}
                    required
                    value={editingFaq.answer || ''}
                    onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white leading-relaxed"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          )}

          {faqs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 text-slate-500 text-xs">
              No FAQs found. Click "Add FAQ" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A77A32] bg-stone-100 px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <h4 className="font-bold text-sm text-[#0F172A] mt-1">{faq.question}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingFaq(faq)}
                      className="p-2 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'faq', id: faq.id, title: faq.question })}
                      className="p-2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CUSTOM DELETE CONFIRMATION MODAL (Safe for iframe)
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-serif text-lg font-bold text-slate-900">Confirm Deletion</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently remove <strong className="text-slate-800">"{deleteTarget.title}"</strong>? This action updates the database.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
