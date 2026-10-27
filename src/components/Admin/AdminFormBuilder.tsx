import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  CheckCircle,
  Eye,
  ArrowUpDown,
  Lock,
  Edit2,
  Save,
  Check,
} from 'lucide-react';
import { InquiryFormField } from '../../types';
import { fetchAdminFormFields, updateAdminFormField } from '../../api';

export const AdminFormBuilder: React.FC = () => {
  const [fields, setFields] = useState<InquiryFormField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InquiryFormField>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadFields = () => {
    setLoading(true);
    fetchAdminFormFields()
      .then(res => setFields(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleStartEdit = (field: InquiryFormField) => {
    setEditingId(field.id);
    setEditForm({ ...field });
  };

  const handleSaveField = async (id: string) => {
    await updateAdminFormField(id, editForm);
    setEditingId(null);
    loadFields();
    setStatusMsg('Field configuration published.');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleEnabled = async (field: InquiryFormField) => {
    if (field.isSystem) return; // cannot disable mandatory system fields
    await updateAdminFormField(field.id, { isEnabled: !field.isEnabled });
    loadFields();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
            Dynamic Questionnaire Form Builder
          </h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Configure labels, field requirements, visibility, and preview the visitor inquiry questionnaire in real time.
          </p>
        </div>

        {statusMsg && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Fields List & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="font-serif text-lg font-bold text-[#0F172A] mb-2">
            Configurable Fields ({fields.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading form builder schema...</div>
          ) : (
            fields.map(fld => {
              const isEditing = editingId === fld.id;
              return (
                <div
                  key={fld.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEditing
                      ? 'bg-[#FDFBF7] border-[#C9A45C] ring-2 ring-[#C9A45C]/20 shadow-md'
                      : fld.isEnabled
                      ? 'bg-white border-stone-200 shadow-sm'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#A77A32]">
                          Key: {fld.fieldKey} ({fld.fieldType})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveField(fld.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Field</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="font-semibold block mb-1">Field Label</label>
                          <input
                            type="text"
                            value={editForm.label || ''}
                            onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={editForm.placeholder || ''}
                            onChange={e => setEditForm({ ...editForm, placeholder: e.target.value })}
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isRequired || false}
                            onChange={e => setEditForm({ ...editForm, isRequired: e.target.checked })}
                            disabled={fld.isSystem && fld.isRequired}
                            className="w-4 h-4"
                          />
                          <span>Required by Client</span>
                        </label>

                        {!fld.isSystem && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.isEnabled || false}
                              onChange={e => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span>Enabled on Public Form</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {fld.displayOrder}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0F172A]">{fld.label}</span>
                            {fld.isRequired && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                            {fld.isSystem && (
                              <span className="text-[10px] font-bold text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Core</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            Type: {fld.fieldType} • Group: {fld.sectionGroup}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!fld.isSystem && (
                          <button
                            onClick={() => handleToggleEnabled(fld)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              fld.isEnabled
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-stone-200 text-slate-600 hover:bg-stone-300'
                            }`}
                          >
                            {fld.isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(fld)}
                          className="p-1.5 text-slate-500 hover:text-[#A77A32] cursor-pointer"
                          title="Edit Field Label/Properties"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Live Interactive Form Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl self-start sticky top-24">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
            <Eye className="w-4 h-4 text-[#C9A45C]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9A45C]">
              Live Visitor Preview
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {fields
              .filter(f => f.isEnabled)
              .map(f => (
                <div key={f.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    {f.label} {f.isRequired && <span className="text-[#C9A45C]">*</span>}
                  </label>
                  {f.fieldType === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={f.placeholder || ''}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                    />
                  ) : f.fieldType === 'select' ? (
                    <select
                      disabled
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                    >
                      <option>{f.placeholder || `Select ${f.label}`}</option>
                    </select>
                  ) : f.fieldType === 'checkbox' ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <input type="checkbox" disabled className="w-3.5 h-3.5" />
                      <span>Multiple choices selectable</span>
                    </div>
                  ) : (
                    <input
                      disabled
                      type={f.fieldType}
                      placeholder={f.placeholder || ''}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
