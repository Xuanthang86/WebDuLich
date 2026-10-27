import React, { useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  Users,
  FileEdit,
  Sliders,
  Mail,
  ShieldAlert,
  Settings,
  UserCheck,
  LogOut,
  ArrowLeft,
  KeyRound,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminLeads } from './AdminLeads';
import { AdminContentCms } from './AdminContentCms';
import { AdminFormBuilder } from './AdminFormBuilder';
import { AdminEmailJobs } from './AdminEmailJobs';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminSettings } from './AdminSettings';
import { AdminUsers } from './AdminUsers';
import { AdminMedia } from './AdminMedia';
import { changePassword, resetDemoData, getAuthToken } from '../../api';

interface AdminLayoutProps {
  onBackToWebsite: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToWebsite }) => {
  const { user, login, logout, fastLoginAs, loading } = useAuth();
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'leads' | 'content' | 'forms' | 'emails' | 'media' | 'audit' | 'settings' | 'users' | 'system'
  >('dashboard');

  // Login form state
  const [emailInput, setEmailInput] = useState('admin@wanderersjourneys.com');
  const [passwordInput, setPasswordInput] = useState('Admin2026!WJ');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<string | null>(null);

  // System Tool status
  const [systemMsg, setSystemMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);
    try {
      await login(emailInput.trim(), passwordInput);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    try {
      await changePassword(currPass, newPass);
      setPassMsg('Password changed successfully. Active sessions refreshed.');
      setCurrPass('');
      setNewPass('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setPassMsg(err.message || 'Failed to update password');
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset entire database state to baseline demo seeds? All custom tests will revert.')) return;
    try {
      await resetDemoData();
      setSystemMsg('Database restored to initial state.');
      setTimeout(() => setSystemMsg(null), 3000);
      window.location.reload();
    } catch (err: any) {
      alert('Error resetting demo: ' + err.message);
    }
  };

  const handleDownloadBackup = () => {
    const token = getAuthToken();
    window.open(`/api/admin/system/backup?token=${token || ''}`, '_blank');
  };

  // If not authenticated, render login view
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-xl mx-auto mb-4">
            <Compass className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="font-brand-display text-2xl font-bold tracking-widest text-white uppercase">
            Wanderer's Journeys
          </h2>
          <p className="text-xs text-[#C9A45C] font-light italic mt-1">
            Executive CMS & Concierge Lead Portal
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl">
            {/* Quick Demo Staff Logins */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A45C] block mb-2">
                One-Click Role Authentication:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fastLoginAs('ADMIN')}
                  className="px-2 py-2 rounded-lg bg-slate-700 hover:bg-[#C9A45C] hover:text-[#0F172A] text-xs font-semibold text-center transition-all cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fastLoginAs('MANAGER')}
                  className="px-2 py-2 rounded-lg bg-slate-700 hover:bg-[#C9A45C] hover:text-[#0F172A] text-xs font-semibold text-center transition-all cursor-pointer"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => fastLoginAs('LEAD_MANAGER')}
                  className="px-2 py-2 rounded-lg bg-slate-700 hover:bg-[#C9A45C] hover:text-[#0F172A] text-xs font-semibold text-center transition-all cursor-pointer"
                >
                  Concierge
                </button>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingLogin ? 'Verifying...' : 'Sign In to Management Portal'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <button
                onClick={onBackToWebsite}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Guest Public Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Admin Portal
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] flex flex-col">
      {/* Top Admin Bar */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A]">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-brand-display text-sm sm:text-base font-bold tracking-wider uppercase block">
              Wanderer's Journeys CMS
            </span>
            <span className="text-[10px] text-[#C9A45C] tracking-wide block">
              Authenticated as {user?.fullName} ({user?.role})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Password</span>
          </button>

          <button
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Visitor Site</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-xs text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-stone-200 p-4 space-y-1 shrink-0 hidden md:block overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Operations & CRM
          </div>

          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#C9A45C]" />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('leads')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'leads'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4 text-[#C9A45C]" />
            <span>Inquiries & Leads</span>
          </button>

          <button
            onClick={() => setActiveNav('emails')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'emails'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <Mail className="w-4 h-4 text-[#C9A45C]" />
            <span>Email Outbox Queue</span>
          </button>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-5 pb-2">
            Content & Design
          </div>

          <button
            onClick={() => setActiveNav('content')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'content'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <FileEdit className="w-4 h-4 text-[#C9A45C]" />
            <span>Content CMS (CRUD)</span>
          </button>

          <button
            onClick={() => setActiveNav('forms')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'forms'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#C9A45C]" />
            <span>Dynamic Form Builder</span>
          </button>

          <button
            onClick={() => setActiveNav('media')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'media'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#C9A45C]" />
            <span>Media Assets Library</span>
          </button>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-5 pb-2">
            System & Security
          </div>

          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'settings'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <Settings className="w-4 h-4 text-[#C9A45C]" />
            <span>Global Site Settings</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveNav('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'users'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#C9A45C]" />
              <span>Staff Accounts (RBAC)</span>
            </button>
          )}

          <button
            onClick={() => setActiveNav('audit')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'audit'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#C9A45C]" />
            <span>Security Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveNav('system')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeNav === 'system'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-[#C9A45C]" />
            <span>Backup & Reset Tools</span>
          </button>
        </aside>

        {/* Mobile Navigation Pills */}
        <div className="md:hidden flex overflow-x-auto p-2 bg-white border-b border-stone-200 gap-1 shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'leads', label: 'Leads' },
            { id: 'content', label: 'CMS' },
            { id: 'forms', label: 'Form Builder' },
            { id: 'emails', label: 'Email Outbox' },
            { id: 'settings', label: 'Settings' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveNav(m.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeNav === m.id ? 'bg-[#0F172A] text-white' : 'bg-stone-100 text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl">
          {activeNav === 'dashboard' && (
            <AdminDashboard onNavigateToLeads={() => setActiveNav('leads')} />
          )}
          {activeNav === 'leads' && <AdminLeads />}
          {activeNav === 'content' && <AdminContentCms />}
          {activeNav === 'forms' && <AdminFormBuilder />}
          {activeNav === 'emails' && <AdminEmailJobs />}
          {activeNav === 'media' && <AdminMedia />}
          {activeNav === 'audit' && <AdminAuditLogs />}
          {activeNav === 'settings' && <AdminSettings />}
          {activeNav === 'users' && <AdminUsers />}
          {activeNav === 'system' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-stone-200">
                <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
                  System Backup & Factory Reset
                </h2>
                <p className="text-xs text-slate-500 font-light mt-0.5">
                  Export transactional state for migration or restore pristine seed data.
                </p>
              </div>

              {systemMsg && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  {systemMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
                  <h3 className="font-serif text-lg font-bold text-[#0F172A]">JSON Database Backup</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">
                    Download complete snapshot of site settings, living catalog, and confidential lead records.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4 text-[#C9A45C]" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
                  <h3 className="font-serif text-lg font-bold text-rose-700">Restore Factory Baseline</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">
                    Resets all CMS records and demo leads back to initial factory baseline. Use for demo reviews.
                  </p>
                  <button
                    onClick={handleResetDemo}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Seed State</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-serif text-xl font-bold text-[#0F172A] mb-2">Change Password</h3>
            <p className="text-xs text-slate-500 mb-4 font-light">
              Updating your credentials will revoke all other active sessions across devices.
            </p>

            {passMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-800">
                {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currPass}
                  onChange={e => setCurrPass(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white font-semibold cursor-pointer"
                >
                  Update & Revoke Other Sessions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
