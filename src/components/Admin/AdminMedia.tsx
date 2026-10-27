import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Copy, Check } from 'lucide-react';
import { fetchAdminMedia, uploadAdminMedia, deleteAdminMedia } from '../../api';

export const AdminMedia: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUrl, setNewUrl] = useState<string>('');
  const [newFilename, setNewFilename] = useState<string>('');
  const [newAlt, setNewAlt] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMedia = () => {
    setLoading(true);
    fetchAdminMedia()
      .then(res => setAssets(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newFilename.trim()) return;

    await uploadAdminMedia({
      filename: newFilename.trim(),
      url: newUrl.trim(),
      altText: newAlt.trim() || newFilename.trim(),
      category: 'general',
    });

    setNewUrl('');
    setNewFilename('');
    setNewAlt('');
    setShowAddModal(false);
    loadMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this asset from media library?')) return;
    await deleteAdminMedia(id);
    loadMedia();
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Media Library</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Manage high-resolution photography assets, alt text, and URLs for website sections.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 text-[#C9A45C]" />
          <span>Add Media Asset</span>
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleAddMedia} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#0F172A]">Register New Media Asset</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Asset Label / Filename</label>
              <input
                type="text"
                required
                value={newFilename}
                onChange={e => setNewFilename(e.target.value)}
                placeholder="e.g. da_nang_oceanfront_villa.jpg"
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Accessibility Alt Text</label>
              <input
                type="text"
                value={newAlt}
                onChange={e => setNewAlt(e.target.value)}
                placeholder="Describe for visually impaired guests"
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Image URL (HTTPS or CDN Link)</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
            >
              Add to Library
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {assets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between group">
            <div className="h-44 bg-slate-900 overflow-hidden relative">
              <img src={asset.url} alt={asset.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-4 flex-1">
              <h4 className="font-bold text-xs text-slate-800 truncate mb-1">{asset.filename}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1 italic">{asset.altText}</p>
            </div>
            <div className="p-3 border-t border-stone-100 bg-[#FDFBF7] flex items-center justify-between">
              <button
                onClick={() => handleCopyUrl(asset.url, asset.id)}
                className="text-[11px] font-semibold text-slate-700 hover:text-[#A77A32] flex items-center gap-1 cursor-pointer"
              >
                {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
              </button>
              <button
                onClick={() => handleDelete(asset.id)}
                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
