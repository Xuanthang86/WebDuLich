import React, { useState, useEffect } from 'react';
import { X, Clock, MessageSquare, User, Shield, CheckCircle, Mail, Phone, MapPin, Calendar, Compass } from 'lucide-react';
import { Lead, LeadStatus, LeadPriority } from '../../types';
import { fetchAdminLeadDetail, updateLeadStatus, addLeadNote, assignLead } from '../../api';

interface LeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const [data, setData] = useState<{ lead: Lead; notes: any[]; history: any[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newNote, setNewNote] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('NEW');
  const [targetPriority, setTargetPriority] = useState<LeadPriority>('MEDIUM');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetchAdminLeadDetail(leadId)
      .then(res => {
        setData(res);
        setTargetStatus(res.lead.status);
        setTargetPriority(res.lead.priority);
      })
      .catch(err => {
        console.error('Error loading lead detail:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [leadId]);

  if (!leadId) return null;

  const handleStatusChange = async () => {
    if (!data) return;
    setIsUpdatingStatus(true);
    try {
      await updateLeadStatus(leadId, targetStatus, statusNote || undefined, targetPriority);
      const refreshed = await fetchAdminLeadDetail(leadId);
      setData(refreshed);
      setStatusNote('');
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await addLeadNote(leadId, newNote.trim());
      const refreshed = await fetchAdminLeadDetail(leadId);
      setData(refreshed);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'QUALIFIED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONVERTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLOSED':
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-6 border-b border-stone-200 bg-[#FDFBF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F3EA] border border-[#C9A45C]/40 flex items-center justify-center text-[#A77A32]">
              <Compass className="w-5 h-5 text-[#C9A45C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#A77A32]">
                  {data?.lead.leadCode || 'Loading...'}
                </span>
                {data && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(data.lead.status)}`}>
                    {data.lead.status}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                {data?.lead.fullName || 'Lead Details'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading || !data ? (
          <div className="p-12 text-center text-slate-500">Loading full inquiry record...</div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 text-sm text-[#0F172A]">
            {/* Quick Contact & Profile Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#F7F3EA] border border-stone-200">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-[#A77A32]" />
                <a href={`mailto:${data.lead.email}`} className="text-blue-700 hover:underline">
                  {data.lead.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-[#A77A32]" />
                <span>{data.lead.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-[#A77A32]" />
                <span>{data.lead.countryCode}</span>
              </div>
            </div>

            {/* Questionnaire Detailed Answers Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Questionnaire Parameters & Selections:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-white border border-stone-200">
                <div>
                  <span className="text-xs text-slate-500 block">Package Desired:</span>
                  <span className="font-semibold text-slate-900">{data.lead.packageName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Destination Hub:</span>
                  <span className="font-semibold text-slate-900">{data.lead.destinationCity}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Duration of Stay:</span>
                  <span className="font-semibold text-slate-900">{data.lead.duration}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Target Arrival Date:</span>
                  <span className="font-semibold text-slate-900">{data.lead.expectedStartDate || 'Flexible'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Number of Guests:</span>
                  <span className="font-semibold text-slate-900">{data.lead.guestCount} Guest(s)</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Age Bracket:</span>
                  <span className="font-semibold text-slate-900">{data.lead.ageGroups || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Residence Style:</span>
                  <span className="font-semibold text-slate-900">{data.lead.preferredAccommodationType || 'Serviced Apartment'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Monthly Budget:</span>
                  <span className="font-semibold text-slate-900">{data.lead.estimatedBudget || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Transportation:</span>
                  <span className="font-semibold text-slate-900">{data.lead.transportPreference || 'Standard'}</span>
                </div>
              </div>

              {/* Activities */}
              {data.lead.activities && data.lead.activities.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-slate-500 block mb-1.5">Interests / Activities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.lead.activities.map((act: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-[#C9A45C]/15 text-[#A77A32] text-xs font-medium">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Notes */}
              {data.lead.additionalNotes && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <span className="text-xs font-bold text-[#A77A32] block mb-1">
                    Client Special Considerations / Dietary / Medical Notes:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-light">
                    "{data.lead.additionalNotes}"
                  </p>
                </div>
              )}
            </div>

            {/* Status Transition Control */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-stone-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Update Status & Priority:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Lead Status</label>
                  <select
                    value={targetStatus}
                    onChange={e => setTargetStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium text-xs sm:text-sm"
                  >
                    <option value="NEW">NEW (Awaiting review)</option>
                    <option value="CONTACTED">CONTACTED (Intro sent)</option>
                    <option value="QUALIFIED">QUALIFIED (Dates/budget matched)</option>
                    <option value="CONVERTED">CONVERTED (Deposit / Lease booked)</option>
                    <option value="CLOSED">CLOSED (Archived / Not proceeding)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Priority</label>
                  <select
                    value={targetPriority}
                    onChange={e => setTargetPriority(e.target.value as LeadPriority)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium text-xs sm:text-sm"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH (Urgent arrival / High budget)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Action Note (Optional)</label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="e.g. Sent sample lease to client"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStatusChange}
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Save Status Update'}
                </button>
              </div>
            </div>

            {/* Internal Concierge Notes Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#A77A32]" />
                <span>Internal Staff Notes ({data.notes.length})</span>
              </h4>

              <form onSubmit={handleAddNote} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Record internal update, phone conversation takeaway, or medical preference..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote || !newNote.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
              </form>

              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {data.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No internal staff notes recorded yet.</p>
                ) : (
                  data.notes.map(note => (
                    <div key={note.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                        <span>{note.authorName}</span>
                        <span className="text-[11px] text-slate-400 font-light">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 font-light leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Change Audit Trail */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#A77A32]" />
                <span>Status Change History</span>
              </h4>
              <div className="space-y-2 text-xs">
                {data.history.map(h => (
                  <div key={h.id} className="flex items-start justify-between py-2 border-b border-stone-100">
                    <div>
                      <span className="font-semibold text-slate-800">{h.changedByName}</span>
                      <span className="text-slate-500"> changed status from </span>
                      <span className="font-medium">{h.oldStatus}</span>
                      <span className="text-slate-500"> to </span>
                      <span className="font-bold text-[#A77A32]">{h.newStatus}</span>
                      {h.note && <p className="text-slate-500 italic mt-0.5">"{h.note}"</p>}
                    </div>
                    <span className="text-slate-400 text-[11px] shrink-0">
                      {new Date(h.changedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-200 bg-[#FDFBF7] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Close Detail View
          </button>
        </div>
      </div>
    </div>
  );
};
