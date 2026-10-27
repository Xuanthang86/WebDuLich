import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Package,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { fetchAdminAnalytics } from '../../api';

interface AdminDashboardProps {
  onNavigateToLeads: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToLeads }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAdminAnalytics()
      .then(res => setAnalytics(res))
      .catch(err => console.error('Error loading analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return <div className="p-12 text-center text-slate-500">Loading business analytics...</div>;
  }

  const { metrics, packageDistribution, cityDistribution, recentLeads } = analytics;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
          Hospitality Executive Dashboard
        </h2>
        <p className="text-xs text-slate-500 font-light mt-0.5">
          Real-time intake performance, package popularity, and conversion metrics calculated from database state.
        </p>
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

        <div className="overflow-x-auto">
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
      </div>
    </div>
  );
};
