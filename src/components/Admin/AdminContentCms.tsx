import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  fetchAdminHero,
  updateAdminHero,
  fetchAdminCoreService,
  updateAdminCoreService,
  fetchAdminPackages,
  saveAdminPackage,
  deleteAdminPackage,
  fetchAdminAccommodations,
  saveAdminAccommodation,
  deleteAdminAccommodation,
  fetchAdminFaqs,
  saveAdminFaq,
  deleteAdminFaq,
} from '../../api';
import { HeroContent, CoreServiceItem, PackageItem, AccommodationItem, FAQItem } from '../../types';

export const AdminContentCms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hero' | 'core' | 'packages' | 'accommodations' | 'faqs'>('hero');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // States
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [core, setCore] = useState<CoreServiceItem | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Package Edit State
  const [editingPkg, setEditingPkg] = useState<Partial<PackageItem> | null>(null);
  // Accommodation Edit State
  const [editingAcc, setEditingAcc] = useState<Partial<AccommodationItem> | null>(null);
  // FAQ Edit State
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);

  // Custom Delete Modal State (replaces blocked window.confirm in iframe)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'package' | 'accommodation' | 'faq';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    // Load all content
    fetchAdminHero().then(setHero);
    fetchAdminCoreService().then(setCore);
    fetchAdminPackages().then(setPackages);
    fetchAdminAccommodations().then(setAccommodations);
    fetchAdminFaqs().then(setFaqs);
  }, []);

  const triggerSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 1. Save Hero
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero) return;
    await updateAdminHero(hero);
    triggerSaveNotification('Hero section content updated successfully.');
  };

  // 2. Save Core Service
  const handleSaveCore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!core) return;
    await updateAdminCoreService(core);
    triggerSaveNotification('Core living inclusions updated.');
  };

  // 3. Save Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    await saveAdminPackage(editingPkg);
    const refreshed = await fetchAdminPackages();
    setPackages(refreshed);
    setEditingPkg(null);
    triggerSaveNotification('Living package saved.');
  };

  // 4. Save Accommodation
  const handleSaveAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc) return;
    await saveAdminAccommodation(editingAcc);
    const refreshed = await fetchAdminAccommodations();
    setAccommodations(refreshed);
    setEditingAcc(null);
    triggerSaveNotification('Accommodation residence saved.');
  };

  // 5. Save FAQ
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    await saveAdminFaq(editingFaq);
    const refreshed = await fetchAdminFaqs();
    setFaqs(refreshed);
    setEditingFaq(null);
    triggerSaveNotification('FAQ saved.');
  };

  // Reliable deletion handler (avoids iframe-blocked window.confirm)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'package') {
        await deleteAdminPackage(deleteTarget.id);
        const refreshed = await fetchAdminPackages();
        setPackages(refreshed);
        triggerSaveNotification(`Package deleted.`);
      } else if (deleteTarget.type === 'accommodation') {
        await deleteAdminAccommodation(deleteTarget.id);
        const refreshed = await fetchAdminAccommodations();
        setAccommodations(refreshed);
        triggerSaveNotification(`Residence deleted.`);
      } else if (deleteTarget.type === 'faq') {
        await deleteAdminFaq(deleteTarget.id);
        const refreshed = await fetchAdminFaqs();
        setFaqs(refreshed);
        triggerSaveNotification('FAQ deleted.');
      }
    } catch (err: any) {
      triggerSaveNotification(err.message || 'Failed to delete item.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Content CMS Manager</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Modify text copy, living packages, pricing parameters, residences, and FAQs without touching code.
          </p>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {[
          { id: 'hero', label: 'Hero Section', icon: Sparkles },
          { id: 'core', label: 'Core Inclusions', icon: Home },
          { id: 'packages', label: 'Living Packages (5)', icon: Package },
          { id: 'accommodations', label: 'Residences Showcase', icon: Building },
          { id: 'faqs', label: 'FAQ Directory', icon: HelpCircle },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4 text-[#C9A45C]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO */}
      {activeTab === 'hero' && hero && (
        <form onSubmit={handleSaveHero} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <h3 className="font-serif text-xl font-bold text-[#0F172A]">Hero Headline & Messaging</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Headline</label>
              <input
                type="text"
                value={hero.headline}
                onChange={e => setHero({ ...hero, headline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-serif font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Slogan Tagline</label>
              <input
                type="text"
                value={hero.tagline}
                onChange={e => setHero({ ...hero, tagline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Badge Tag</label>
              <input
                type="text"
                value={hero.badgeText}
                onChange={e => setHero({ ...hero, badgeText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Introduction Subtext (WRC Model)</label>
              <textarea
                rows={3}
                value={hero.subtext}
                onChange={e => setHero({ ...hero, subtext: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm leading-relaxed"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Background Image URL</label>
              <input
                type="text"
                value={hero.backgroundImageUrl}
                onChange={e => setHero({ ...hero, backgroundImageUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Hero Section</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CORE INCLUSIONS */}
      {activeTab === 'core' && core && (
        <form onSubmit={handleSaveCore} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <h3 className="font-serif text-xl font-bold text-[#0F172A]">Core Living Package Inclusions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
              <input
                type="text"
                value={core.title}
                onChange={e => setCore({ ...core, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Starting Reference Price (USD)</label>
              <input
                type="number"
                value={core.monthlyStartingPrice}
                onChange={e => setCore({ ...core, monthlyStartingPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Overview Description</label>
              <textarea
                rows={2}
                value={core.description}
                onChange={e => setCore({ ...core, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Utility Credit Allowance Note</label>
              <input
                type="text"
                value={core.utilityAllowanceNote}
                onChange={e => setCore({ ...core, utilityAllowanceNote: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Housekeeping Schedule</label>
              <input
                type="text"
                value={core.cleaningSchedule}
                onChange={e => setCore({ ...core, cleaningSchedule: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Internet Speed</label>
              <input
                type="text"
                value={core.internetSpeed}
                onChange={e => setCore({ ...core, internetSpeed: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Personal Assistant / Concierge Description</label>
              <input
                type="text"
                value={core.personalAssistant}
                onChange={e => setCore({ ...core, personalAssistant: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Core Inclusions</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PACKAGES CRUD */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl font-bold text-[#0F172A]">Living Packages Catalog ({packages.length})</h3>
            <button
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
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add Living Package</span>
            </button>
          </div>

          {/* Edit Form Modal/Drawer */}
          {editingPkg && (
            <form onSubmit={handleSavePackage} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingPkg.id ? 'Edit Living Package' : 'Create New Living Package'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                  <label className="font-semibold block mb-1">Duration</label>
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
                  <label className="font-semibold block mb-1">Summary</label>
                  <textarea
                    rows={2}
                    value={editingPkg.summary || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, summary: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={editingPkg.imageUrl || ''}
                    onChange={e => setEditingPkg({ ...editingPkg, imageUrl: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-4 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPkg.isFeatured || false}
                      onChange={e => setEditingPkg({ ...editingPkg, isFeatured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Highlight as Featured Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPkg.isPublished ?? true}
                      onChange={e => setEditingPkg({ ...editingPkg, isPublished: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Published on Website</span>
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
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Package
                </button>
              </div>
            </form>
          )}

          {/* List */}
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
        </div>
      )}

      {/* TAB 4: ACCOMMODATIONS CRUD */}
      {activeTab === 'accommodations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl font-bold text-[#0F172A]">Residences Showcase ({accommodations.length})</h3>
            <button
              onClick={() =>
                setEditingAcc({
                  title: '',
                  city: 'Da Nang',
                  district: 'My Khe Beachside',
                  propertyType: 'Ocean Villa',
                  bedrooms: 2,
                  bathrooms: 2,
                  areaSqm: 105,
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
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add Residence</span>
            </button>
          </div>

          {editingAcc && (
            <form onSubmit={handleSaveAccommodation} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingAcc.id ? 'Edit Residence' : 'Add New Residence'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
                  <div className="flex items-center justify-between">
                    <label className="font-semibold block text-slate-700">Primary Residence Image</label>
                    <span className="text-[11px] text-slate-500">Upload file from PC/Laptop or enter image URL</span>
                  </div>

                  {/* Image Preview if available */}
                  {editingAcc.images?.[0]?.url && (
                    <div className="relative rounded-xl overflow-hidden h-48 bg-slate-900 border border-stone-200 group">
                      <img
                        src={editingAcc.images[0].url}
                        alt="Residence Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAcc({ ...editingAcc, images: [] })}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove Photo</span>
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[10px] text-white">
                        {editingAcc.images[0].caption || 'Selected Residence Photo'}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* PC/Laptop File Upload */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Option A: Upload File from PC / Laptop
                      </label>
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#C9A45C]/70 hover:border-[#C9A45C] bg-[#FDFBF7] hover:bg-[#F7F3EA] text-xs font-semibold text-[#0F172A] cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-4 h-4 text-[#C9A45C]" />
                        <span>Choose Image File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = evt => {
                                const base64 = evt.target?.result as string;
                                setEditingAcc({
                                  ...editingAcc,
                                  images: [
                                    {
                                      id: `img_${Date.now()}`,
                                      url: base64,
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
                      <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG, WebP up to 5MB</p>
                    </div>

                    {/* Image URL Link */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Option B: Or Paste Image URL Link
                      </label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
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
                        className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Direct web link or CDN asset</p>
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
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save Residence
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accommodations.map(acc => (
              <div key={acc.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <img src={acc.images[0]?.url} alt={acc.title} className="h-40 w-full object-cover" />
                <div className="p-4 flex-1">
                  <div className="text-[11px] font-bold text-[#A77A32] uppercase">{acc.city} • {acc.propertyType}</div>
                  <h4 className="font-serif font-bold text-base text-[#0F172A] mt-1">{acc.title}</h4>
                  <div className="text-xs text-slate-500 mt-1">{acc.bedrooms} Bed • {acc.bathrooms} Bath • {acc.areaSqm} sqm</div>
                  <div className="text-sm font-bold text-[#0F172A] mt-2">${acc.priceMonthUsd} / mo</div>
                </div>
                <div className="p-4 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => setEditingAcc(acc)}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'accommodation', id: acc.id, title: acc.title })}
                    className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FAQS CRUD */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl font-bold text-[#0F172A]">Frequently Asked Questions ({faqs.length})</h3>
            <button
              onClick={() =>
                setEditingFaq({
                  category: 'General',
                  question: '',
                  answer: '',
                  isPublished: true,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </button>
          </div>

          {editingFaq && (
            <form onSubmit={handleSaveFaq} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">
                {editingFaq.id ? 'Edit FAQ' : 'Add FAQ'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          )}

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
                    className="p-2 text-xs font-bold text-blue-700 hover:underline"
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
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">Confirm Deletion</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this {deleteTarget.type}?
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 line-clamp-2">
                "{deleteTarget.title}"
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
