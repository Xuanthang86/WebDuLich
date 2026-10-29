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
  Eye,
  EyeOff,
  Menu,
  X,
  Shield,
  Lock,
  ChevronRight,
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

type NavSection =
  | 'dashboard'
  | 'leads'
  | 'content'
  | 'forms'
  | 'emails'
  | 'media'
  | 'audit'
  | 'settings'
  | 'users'
  | 'system';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToWebsite }) => {
  const { user, login, logout, fastLoginAs, loading } = useAuth();
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form state
  const [emailInput, setEmailInput] = useState('admin@wanderersjourneys.com');
  const [passwordInput, setPasswordInput] = useState('Admin2026!WJ');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // System Tool status
  const [systemMsg, setSystemMsg] = useState<string | null>(null);

  // Role accounts directory for transparent switching
  const roleAccounts = [
    {
      role: 'ADMIN' as const,
      title: 'Super Administrator',
      name: 'Alexander Vance',
      email: 'admin@wanderersjourneys.com',
      password: 'Admin2026!WJ',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      description: 'Full system control, staff provisioning, system reset & all CMS modules.',
    },
    {
      role: 'MANAGER' as const,
      title: 'Content & Operations Manager',
      name: 'Mai Nguyen',
      email: 'manager@wanderersjourneys.com',
      password: 'Manager2026!WJ',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'CMS Catalog (Packages, Residences, FAQs), Form Builder & Lead management.',
    },
    {
      role: 'LEAD_MANAGER' as const,
      title: 'Concierge Lead Specialist',
      name: 'David Sterling',
      email: 'concierge@wanderersjourneys.com',
      password: 'Lead2026!WJ',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Guest proposal intake, status progression, internal notes & exports only.',
    },
  ];

  const handleSelectRoleAccount = (account: (typeof roleAccounts)[0]) => {
    setEmailInput(account.email);
    setPasswordInput(account.password);
    setLoginError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginError(null);
    setIsSubmittingLogin(true);
    try {
      await login(emailInput.trim(), passwordInput);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleFastLogin = async (role: 'ADMIN' | 'MANAGER' | 'LEAD_MANAGER') => {
    setLoginError(null);
    setIsSubmittingLogin(true);
    try {
      await fastLoginAs(role);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed for this role account.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setActiveNav('dashboard');
      setMobileMenuOpen(false);
    } catch (err) {
      console.warn('Logout error handled:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassError(null);
    if (!currPass || !newPass) {
      setPassError('Please fill in both fields.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    setIsChangingPass(true);
    try {
      await changePassword(currPass, newPass);
      setPassMsg('Password changed successfully. Other active sessions were revoked.');
      setCurrPass('');
      setNewPass('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setIsChangingPass(false);
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

  // Determine allowed navigation items for the current user's role
  const getVisibleNavItems = () => {
    if (!user) return [];
    const role = user.role;

    const items: Array<{ id: NavSection; label: string; icon: any; category: string }> = [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'Operations & CRM' },
      { id: 'leads', label: 'Inquiries & Leads', icon: Users, category: 'Operations & CRM' },
    ];

    // Manager and Admin can access Email Outbox, CMS, Form Builder, Media
    if (role === 'ADMIN' || role === 'MANAGER') {
      items.push({ id: 'emails', label: 'Email Outbox Queue', icon: Mail, category: 'Operations & CRM' });
      items.push({ id: 'content', label: 'Content CMS (CRUD)', icon: FileEdit, category: 'Content & Catalog' });
      items.push({ id: 'forms', label: 'Dynamic Form Builder', icon: Sliders, category: 'Content & Catalog' });
      items.push({ id: 'media', label: 'Media Assets Library', icon: ImageIcon, category: 'Content & Catalog' });
    }

    // Only Admin can access Global Settings, Staff Accounts, Audit Logs, Backup/Reset
    if (role === 'ADMIN') {
      items.push({ id: 'settings', label: 'Global Site Settings', icon: Settings, category: 'System & Security' });
      items.push({ id: 'users', label: 'Staff Accounts (RBAC)', icon: UserCheck, category: 'System & Security' });
      items.push({ id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert, category: 'System & Security' });
      items.push({ id: 'system', label: 'Backup & Reset Tools', icon: RotateCcw, category: 'System & Security' });
    }

    return items;
  };

  const visibleNavItems = getVisibleNavItems();

  // If currently active nav item is not allowed for this role, fallback to dashboard
  React.useEffect(() => {
    if (user && visibleNavItems.length > 0) {
      const isAllowed = visibleNavItems.some(i => i.id === activeNav);
      if (!isAllowed) {
        setActiveNav('dashboard');
      }
    }
  }, [user, activeNav]);

  // =========================================================================
  // 1. LOGIN SCREEN (When not authenticated)
  // =========================================================================
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-xl mx-auto mb-4 border border-[#C9A45C]/40">
            <Compass className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="font-brand-display text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase">
            Wanderer's Journeys
          </h1>
          <p className="text-xs sm:text-sm text-[#C9A45C] font-light italic mt-1.5">
            Executive CMS & Concierge Lead Portal
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
            {/* Role Accounts Selector - Clarifies 3 Distinct Permissions */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A45C]">
                  Role-Based Access Control (Select Account):
                </span>
                <span className="text-[10px] text-slate-400">3 Distinct Roles</span>
              </div>

              <div className="space-y-2 mt-2">
                {roleAccounts.map(acc => {
                  const isSelected = emailInput === acc.email;
                  return (
                    <div
                      key={acc.role}
                      onClick={() => handleSelectRoleAccount(acc)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#C9A45C]/15 border-[#C9A45C] ring-1 ring-[#C9A45C]'
                          : 'bg-slate-800/90 border-slate-700 hover:border-slate-500 hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-xs text-white truncate">{acc.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${acc.badgeClass}`}>
                            {acc.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</div>
                        <div className="text-[10px] text-slate-300 font-light mt-1 leading-tight">
                          {acc.description}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleFastLogin(acc.role);
                        }}
                        disabled={isSubmittingLogin}
                        className="px-2.5 py-1.5 rounded-lg bg-[#C9A45C] hover:bg-[#d8b368] text-[#0F172A] text-[11px] font-bold shrink-0 self-center transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isSubmittingLogin && isSelected ? 'Signing in...' : 'Sign In'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Standard Login Form with Show/Hide Password Eye Toggle */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@wanderersjourneys.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A45C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#C9A45C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] font-bold text-sm tracking-wide hover:from-[#d8b368] hover:to-[#b8893d] transition-all cursor-pointer shadow-lg shadow-[#C9A45C]/20 disabled:opacity-50 mt-2"
              >
                {isSubmittingLogin ? 'Verifying Credentials...' : 'Sign In with Selected Credentials'}
              </button>
            </form>

            {/* Return to Guest Public Website Button with visible, distinct border */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={onBackToWebsite}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-slate-700 hover:border-[#C9A45C] bg-slate-800/80 hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4 text-[#C9A45C]" />
                <span>Return to Guest Public Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN PORTAL (Mobile Responsive)
  // =========================================================================
  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
            Super Administrator
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 shrink-0">
            Content Manager
          </span>
        );
      case 'LEAD_MANAGER':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            Concierge Specialist
          </span>
        );
    }
  };

  const handleNavSelect = (navId: NavSection) => {
    setActiveNav(navId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] flex flex-col">
      {/* Top Admin Header Bar - Fully Optimized for Mobile & Desktop */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#C9A45C]" /> : <Menu className="w-5 h-5 text-[#C9A45C]" />}
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shrink-0 shadow-sm">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <span className="font-brand-display text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase block truncate">
              Wanderer's Journeys
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate hidden sm:inline">
                {user?.fullName}
              </span>
              {getRoleBadge()}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Change Account Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 hover:border-[#C9A45C] bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 transition-all cursor-pointer"
            title="Return to Public Website"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span className="hidden sm:inline">Visitor Site</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-xs text-rose-200 transition-colors cursor-pointer font-medium"
            title="Sign out of Management Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container: Vertical on mobile, horizontal with sidebar on desktop */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Desktop Sidebar (Left) */}
        <aside className="w-64 bg-white border-r border-stone-200 p-4 space-y-1 shrink-0 hidden md:block overflow-y-auto">
          {/* Current User Role Notice Card */}
          <div className="mb-4 p-3 rounded-2xl bg-[#FDFBF7] border border-stone-200 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Active Authorization:
            </div>
            <div className="font-bold text-slate-900">{user?.fullName}</div>
            <div className="text-[11px] text-[#A77A32] font-semibold mt-0.5">
              Role: {user?.role}
            </div>
          </div>

          <div className="space-y-4">
            {['Operations & CRM', 'Content & Catalog', 'System & Security'].map(cat => {
              const catItems = visibleNavItems.filter(i => i.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    {cat}
                  </div>
                  <div className="space-y-1 mt-1">
                    {catItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveNav(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#0F172A] text-white shadow-sm'
                              : 'text-slate-700 hover:bg-stone-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A45C]' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer / Slide-Over Sheet (Visible when hamburger is clicked) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-over panel */}
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-50 overflow-y-auto">
              <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#C9A45C] flex items-center justify-center text-[#0F172A]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-brand-display text-xs font-bold uppercase tracking-wider">
                      Navigation Menu
                    </div>
                    <div className="text-[10px] text-[#C9A45C] font-mono">{user?.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 flex-1">
                {['Operations & CRM', 'Content & Catalog', 'System & Security'].map(cat => {
                  const catItems = visibleNavItems.filter(i => i.category === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
                        {cat}
                      </div>
                      <div className="space-y-1">
                        {catItems.map(item => {
                          const Icon = item.icon;
                          const isActive = activeNav === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNavSelect(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#0F172A] text-white shadow-sm'
                                  : 'text-slate-800 hover:bg-stone-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A45C]' : 'text-slate-500'}`} />
                                <span>{item.label}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Controls in Mobile Drawer */}
              <div className="p-4 border-t border-stone-200 bg-[#FDFBF7] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-[#A77A32]" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Column (Mobile Stack + Desktop Full Area) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile Quick Navigation Bar */}
          <div className="md:hidden w-full bg-white border-b border-stone-200 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0 shadow-xs">
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-sm ring-1 ring-[#C9A45C]/40'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C9A45C]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active section breadcrumb on mobile for instant clarity */}
          <div className="md:hidden bg-[#FDFBF7] px-3.5 py-1.5 border-b border-stone-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="font-semibold text-slate-800">
              Active: <span className="text-[#A77A32]">{visibleNavItems.find(i => i.id === activeNav)?.label}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Role: <span className="font-mono text-slate-600">{user?.role}</span>
            </span>
          </div>

          {/* Main Content Area - Responsive for all viewports (320px -> 1920px) */}
          <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
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
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F172A]">
                    System Backup & Factory Reset
                  </h2>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    Export transactional state for migration or restore pristine seed data.
                  </p>
                </div>

                {systemMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
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
                      type="button"
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
                      type="button"
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
      </div>

      {/* Change Password Modal with Eye Show/Hide Toggle */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl font-bold text-[#0F172A]">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-light">
              Updating your credentials will revoke all other active sessions across devices.
            </p>

            {passMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                {passMsg}
              </div>
            )}
            {passError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrPass ? 'text' : 'password'}
                    required
                    value={currPass}
                    onChange={e => setCurrPass(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrPass(!showCurrPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showCurrPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">New Password (Min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? 'Updating...' : 'Update & Revoke Other Sessions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
