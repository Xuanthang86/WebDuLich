import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Package,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { fetchAdminAnalytics } from '../../api';

interface AdminDashboardProps {
  onNavigateToLeads: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToLeads }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAdminAnalytics()
      .then(res => {
        if (!res) {
          throw new Error('Analytics response was empty or malformed.');
        }
        setAnalytics(res);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading analytics:', err);
        setError(err.message || 'Unable to retrieve executive analytics from the database.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // 1. Loading State
  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
              Hospitality Executive Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              Loading real-time performance indicators and database metrics...
            </p>
          </div>
        </div>

        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#C9A45C]/30 border-t-[#C9A45C] animate-spin" />
          <p className="text-sm font-medium text-slate-700">Loading business analytics from database...</p>
          <span className="text-xs text-slate-400 font-light">Aggregating inquiry metrics and conversion rates</span>
        </div>
      </div>
    );
  }

  // 2. Error State (With Retry capability)
  if (error && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
              Hospitality Executive Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              Intake performance, package popularity, and conversion metrics.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Unable to Load Business Analytics</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#C9A45C] hover:text-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading Analytics</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty State (When no leads exist)
  if (analytics && analytics.metrics && analytics.metrics.totalLeads === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
              Hospitality Executive Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-light mt-0.5">
              Real-time intake performance, package popularity, and conversion metrics calculated from database state.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            className="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">No Inquiries in Pipeline Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              New client proposals submitted through the website questionnaire will appear here with instant analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToLeads}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <span>Go to Leads Management</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const { metrics, packageDistribution, cityDistribution, recentLeads } = analytics;

  return (
    <div className="space-y-8">
      {/* Title with Refresh Button */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
            Hospitality Executive Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Real-time intake performance, package popularity, and conversion metrics calculated from database state.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Refresh metrics from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Inquiries</div>
          <div className="font-serif text-3xl font-bold text-[#0F172A]">{metrics.totalLeads}</div>
          <div className="text-[11px] text-[#A77A32] font-semibold mt-1">100% Pipeline Intake</div>
        </div>

        {/* New */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">New Uncontacted</div>
          <div className="font-serif text-3xl font-bold text-blue-700">{metrics.newLeads}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Needs Response</div>
        </div>

        {/* Contacted */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Contacted</div>
          <div className="font-serif text-3xl font-bold text-amber-700">{metrics.contactedLeads}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">In Dialogue</div>
        </div>

        {/* Qualified */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Qualified</div>
          <div className="font-serif text-3xl font-bold text-purple-700">{metrics.qualifiedLeads}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">Dates & Hub Matched</div>
        </div>

        {/* Converted */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">Converted</div>
          <div className="font-serif text-3xl font-bold text-emerald-700">{metrics.convertedLeads}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Lease / Deposit Placed</div>
        </div>

        {/* Conversion % */}
        <div className="bg-white p-5 rounded-2xl border border-[#C9A45C]/40 shadow-sm bg-gradient-to-br from-white to-[#FDFBF7]">
          <div className="text-xs text-slate-500 font-medium mb-1">Conversion Rate</div>
          <div className="font-serif text-3xl font-bold text-[#A77A32]">
            {metrics.conversionRatePercent}%
          </div>
          <div className="text-[11px] text-slate-500 font-light mt-1">Lead to Resident</div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Package Popularity */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#A77A32]" />
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">
              Inquiries by Living Package
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(packageDistribution).map(([pkg, count]: [string, any]) => {
              const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;
              return (
                <div key={pkg}>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <span className="truncate pr-2">{pkg}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A45C] to-[#A77A32] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coastal City Preferences */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#A77A32]" />
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">
              Destination Hub Selections
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(cityDistribution).map(([city, count]: [string, any]) => {
              const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;
              return (
                <div key={city}>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <span className="truncate pr-2">{city}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F172A] to-slate-700 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Leads Quick Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#A77A32]" />
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">
              Recent Client Inquiries
            </h3>
          </div>
          <button
            onClick={onNavigateToLeads}
            className="text-xs font-bold text-[#A77A32] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Leads</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Package</th>
                <th className="py-2.5 px-3">Hub</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentLeads?.map((l: any) => (
                <tr key={l.id} className="hover:bg-stone-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#A77A32]">{l.leadCode}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{l.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{l.packageName}</td>
                  <td className="py-2.5 px-3 text-slate-500">{l.destinationCity}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700">
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Quick Inquiries List */}
        <div className="sm:hidden divide-y divide-stone-100 -mx-2">
          {recentLeads?.map((l: any) => (
            <div key={l.id} className="p-3 space-y-1.5 hover:bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#A77A32] text-xs">{l.leadCode}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700">
                  {l.status}
                </span>
              </div>
              <div className="font-medium text-slate-900 text-xs">{l.fullName}</div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{l.packageName} • {l.destinationCity}</span>
                <span className="text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
