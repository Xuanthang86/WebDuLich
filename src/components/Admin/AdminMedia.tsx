import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2, Copy, Check, Upload, X } from 'lucide-react';
import { fetchAdminMedia, uploadAdminMedia, deleteAdminMedia } from '../../api';

export const AdminMedia: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUrl, setNewUrl] = useState<string>('');
  const [newFilename, setNewFilename] = useState<string>('');
  const [newAlt, setNewAlt] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; filename: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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

    try {
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
      triggerToast('Media asset added to library.');
      loadMedia();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to add media asset.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminMedia(deleteTarget.id);
      triggerToast(`Media asset "${deleteTarget.filename}" deleted.`);
      loadMedia();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete asset.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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

      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {showAddModal && (
        <form onSubmit={handleAddMedia} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">Register New Media Asset</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {newUrl && (
            <div className="relative rounded-xl overflow-hidden h-44 bg-slate-900 border border-stone-200">
              <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setNewUrl('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Upload from Laptop/PC */}
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Upload File from Laptop / PC</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#C9A45C]/70 hover:border-[#C9A45C] bg-white hover:bg-stone-50 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-[#C9A45C]" />
                <span className="font-semibold text-slate-700">Choose Image from Computer</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewFilename(file.name);
                      if (!newAlt) setNewAlt(file.name.replace(/\.[^/.]+$/, ''));
                      const reader = new FileReader();
                      reader.onload = evt => {
                        setNewUrl(evt.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Or Paste Image URL (HTTPS Link)</label>
              <input
                type="text"
                value={newUrl.startsWith('data:') ? '' : newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-mono"
              />
            </div>

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
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs cursor-pointer hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newUrl.trim() || !newFilename.trim()}
              className="px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
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
                onClick={() => setDeleteTarget({ id: asset.id, filename: asset.filename })}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                title="Delete Media Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-serif text-lg font-bold text-[#0F172A]">Delete Media Asset</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this media asset from the library?
              </p>
              <p className="text-xs font-semibold text-[#0F172A] mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 truncate">
                "{deleteTarget.filename}"
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
