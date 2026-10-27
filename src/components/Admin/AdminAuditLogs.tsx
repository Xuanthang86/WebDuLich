import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Filter } from 'lucide-react';
import { AuditLog } from '../../types';
import { fetchAdminAuditLogs } from '../../api';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLogs = () => {
    setLoading(true);
    fetchAdminAuditLogs()
      .then(res => setLogs(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Security Audit Trail</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Immutable tracking of administrative actions, data mutations, logins, and access requests.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-stone-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No logs recorded yet.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{log.userEmail}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{log.details}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.ipAddress || 'Internal'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
