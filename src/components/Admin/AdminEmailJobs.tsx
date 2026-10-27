import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { EmailJob } from '../../types';
import { fetchAdminEmailJobs, retryEmailJob } from '../../api';

export const AdminEmailJobs: React.FC = () => {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadJobs = () => {
    setLoading(true);
    fetchAdminEmailJobs()
      .then(res => setJobs(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await retryEmailJob(id);
      loadJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
            Email Notification Outbox Queue
          </h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Monitors asynchronous proposal alerts sent to info@wanderersjourneys.com with retry capabilities.
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Outbox</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-stone-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject & Preview</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading email jobs...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No email jobs in outbox.</td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{job.id}</td>
                    <td className="py-3 px-4 font-medium">{job.recipientEmail}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{job.subject}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-md">{job.bodyPreview}</div>
                    </td>
                    <td className="py-3 px-4">
                      {job.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SENT</span>
                        </span>
                      ) : job.status === 'QUEUED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>QUEUED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {job.attempts} / {job.maxAttempts}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(job.scheduledAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={retryingId === job.id}
                          className="px-3 py-1 rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          {retryingId === job.id ? 'Retrying...' : 'Retry Send'}
                        </button>
                      )}
                    </td>
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
