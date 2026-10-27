import React, { useState, useEffect } from 'react';
import { Save, Check, Globe, Mail, Phone, MapPin, Share2 } from 'lucide-react';
import { SiteSettings } from '../../types';
import { fetchAdminSettings, updateAdminSettings } from '../../api';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSettings()
      .then(res => setSettings(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateAdminSettings(settings);
      setSettings(updated);
      setSavedMsg('Settings updated successfully.');
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-slate-500">Loading system settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Global Site Settings</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Manage branding, SEO defaults, contact points, and verified social media channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{savedMsg}</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand & Identity */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Globe className="w-4 h-4 text-[#A77A32]" />
            <h3 className="font-serif text-base font-bold text-[#0F172A]">Brand Identity</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name</label>
            <input
              type="text"
              value={settings.brandName}
              onChange={e => setSettings({ ...settings, brandName: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Brand Slogan</label>
            <input
              type="text"
              value={settings.slogan}
              onChange={e => setSettings({ ...settings, slogan: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Default SEO Meta Title</label>
            <input
              type="text"
              value={settings.defaultSeoTitle}
              onChange={e => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Default SEO Meta Description</label>
            <textarea
              rows={2}
              value={settings.defaultSeoDescription}
              onChange={e => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-xs"
            />
          </div>
        </div>

        {/* Contact & Notification Outbox */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Mail className="w-4 h-4 text-[#A77A32]" />
            <h3 className="font-serif text-base font-bold text-[#0F172A]">Contact Points & Email Queue</h3>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Public Inquiries Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Internal Lead Notification Email</label>
            <input
              type="email"
              value={settings.notificationEmail || 'info@wanderersjourneys.com'}
              onChange={e => setSettings({ ...settings, notificationEmail: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm font-mono text-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              All new proposal inquiries trigger notification jobs to this verified address.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Concierge Telephone</label>
            <input
              type="text"
              value={settings.contactPhone}
              onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Executive Office Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-stone-300 text-xs"
            />
          </div>
        </div>

        {/* Social Media Channels */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Share2 className="w-4 h-4 text-[#A77A32]" />
            <h3 className="font-serif text-base font-bold text-[#0F172A]">Social Media Channels (Official Level 1 Links)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Facebook Fanpage URL</label>
              <input
                type="url"
                value={settings.socialLinks?.facebook || ''}
                onChange={e =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, facebook: e.target.value },
                  })
                }
                placeholder="https://facebook.com/wanderersjourneys"
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Instagram Profile URL</label>
              <input
                type="url"
                value={settings.socialLinks?.instagram || ''}
                onChange={e =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, instagram: e.target.value },
                  })
                }
                placeholder="https://instagram.com/wanderersjourneys"
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">TikTok Profile URL</label>
              <input
                type="url"
                value={settings.socialLinks?.tiktok || ''}
                onChange={e =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, tiktok: e.target.value },
                  })
                }
                placeholder="https://tiktok.com/@wanderersjourneys"
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Disclaimers & Footer Notes */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-serif text-base font-bold text-[#0F172A]">Regulatory Disclaimer & Budget Messaging</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hospitality Regulatory Notice (Footer)</label>
              <textarea
                rows={2}
                value={settings.footerNote}
                onChange={e => setSettings({ ...settings, footerNote: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Comparative Budget Projection Statement</label>
              <textarea
                rows={2}
                value={settings.budgetComparisonMessage}
                onChange={e => setSettings({ ...settings, budgetComparisonMessage: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
