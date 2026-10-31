import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { fetchAdminLeads } from '../../api';
import { LeadDetailModal } from './LeadDetailModal';

export const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const loadLeads = () => {
    setLoading(true);
    fetchAdminLeads({
      status: statusFilter,
      city: cityFilter,
      search: searchTerm,
      priority: priorityFilter,
    })
      .then(res => {
        setLeads(res.leads);
      })
      .catch(err => {
        console.error('Error fetching leads:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLeads();
  }, [statusFilter, cityFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleExportCsv = () => {
    window.open('/api/admin/export/csv', '_blank');
  };

  const handleExportExcel = () => {
    window.open('/api/admin/export/excel', '_blank');
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">NEW</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">CONTACTED</span>;
      case 'QUALIFIED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">QUALIFIED</span>;
      case 'CONVERTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CONVERTED</span>;
      case 'CLOSED':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">CLOSED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
            Inquiries & Lead Management
          </h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Manage incoming retirement proposals, guest criteria, stage transitions, and concierge notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLeads}
            className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-[#C9A45C] text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#A77A32]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#C9A45C]" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by client name, email, phone, or lead code (e.g. WJ-2026)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs sm:text-sm focus:outline-none focus:border-[#C9A45C]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter-select" className="text-slate-500 font-semibold shrink-0">Status:</label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:border-[#C9A45C] focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses (Pipeline)</option>
              <option value="NEW">NEW - Intake uncontacted</option>
              <option value="CONTACTED">CONTACTED - Dialogue in progress</option>
              <option value="QUALIFIED">QUALIFIED - Match confirmed</option>
              <option value="CONVERTED">CONVERTED - Deposit / Lease confirmed</option>
              <option value="CLOSED">CLOSED - Archived / Lost</option>
            </select>
          </div>

          {/* Hub Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="hub-filter-select" className="text-slate-500 font-semibold shrink-0">Hub:</label>
            <select
              id="hub-filter-select"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:border-[#C9A45C] focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Destination Hubs</option>
              <option value="Da Nang">Da Nang Coastal Hub</option>
              <option value="Nha Trang">Nha Trang Bay</option>
              <option value="Ho Chi Minh City">Ho Chi Minh City</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="priority-filter-select" className="text-slate-500 font-semibold shrink-0">Priority:</label>
            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:border-[#C9A45C] focus:bg-white transition-all cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Container (Dual View: Desktop Table + Mobile Card Stack) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-stone-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Lead Code</th>
                <th className="py-3.5 px-4">Guest Details</th>
                <th className="py-3.5 px-4">Hub & Package</th>
                <th className="py-3.5 px-4">Stay & Guests</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading inquiries...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No leads match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#A77A32]">
                      {lead.leadCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A]">{lead.fullName}</div>
                      <div className="text-slate-500 text-xs">{lead.email}</div>
                      <div className="text-slate-400 text-[11px]">{lead.countryCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{lead.packageName}</div>
                      <div className="text-slate-500 text-xs">{lead.destinationCity}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium">{lead.duration}</div>
                      <div className="text-slate-500 text-xs">{lead.guestCount} Guests • {lead.ageGroups || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        lead.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : lead.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLeadId(lead.id);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 hover:border-[#C9A45C] hover:bg-stone-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#A77A32]" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack View (< 768px) */}
        <div className="md:hidden divide-y divide-stone-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading inquiries...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs p-4">
              No leads match the specified search or filter criteria.
            </div>
          ) : (
            leads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className="p-4 hover:bg-amber-50/30 transition-colors active:bg-amber-50 cursor-pointer space-y-3"
              >
                {/* Header row: code + badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#A77A32] text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {lead.leadCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(lead.status)}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      lead.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : lead.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {lead.priority}
                    </span>
                  </div>
                </div>

                {/* Client info */}
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm">
                    {lead.fullName}
                  </h4>
                  <div className="text-slate-500 text-xs font-sans mt-0.5">
                    {lead.email} {lead.countryCode ? `• ${lead.countryCode}` : ''}
                  </div>
                </div>

                {/* Package & Stay details */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Package / Hub</span>
                    <span className="font-semibold text-slate-800">{lead.packageName}</span>
                    <span className="text-slate-500 block">{lead.destinationCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stay / Party</span>
                    <span className="font-semibold text-slate-800">{lead.duration}</span>
                    <span className="text-slate-500 block">{lead.guestCount} Guests</span>
                  </div>
                </div>

                {/* Footer with date and action button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(lead.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedLeadId(lead.id);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer Count */}
        <div className="p-3 sm:p-4 bg-[#FDFBF7] border-t border-stone-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <span>Showing {leads.length} total proposal inquiries</span>
          <span>Click any card/row to open the complete concierge profile</span>
        </div>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={loadLeads}
      />
    </div>
  );
};
