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
  ChevronDown,
  ChevronUp,
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
import { changePassword, updateUserProfile, resetDemoData, getAuthToken } from '../../api';

interface AdminLayoutProps {
  onBackToWebsite: () => void;
  settings?: any;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
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

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onBackToWebsite,
  settings,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const { user, login, logout, loading, updateUserInContext } = useAuth();
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form state - clean, secure initial values
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Account Profile & Settings Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Collapsible Change Password Section
  const [isPasswordAccordionOpen, setIsPasswordAccordionOpen] = useState(false);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Synchronize profile name with user state when opened
  React.useEffect(() => {
    if (user?.fullName) {
      setProfileFullName(user.fullName);
    }
  }, [user]);

  // System Tool status
  const [systemMsg, setSystemMsg] = useState<string | null>(null);

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

  const handleLogout = async () => {
    try {
      await logout();
      setActiveNav('dashboard');
      setMobileMenuOpen(false);
    } catch (err) {
      console.warn('Logout error handled:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be blank.' });
      return;
    }
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await updateUserProfile(profileFullName.trim());
      updateUserInContext({ fullName: updated.fullName });
      setProfileMsg({ type: 'success', text: 'Account profile updated successfully.' });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassError(null);
    if (!currPass || !newPass || !confirmPass) {
      setPassError('Please fill in all three password fields.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (
      !/[A-Z]/.test(newPass) ||
      !/[a-z]/.test(newPass) ||
      !/[0-9]/.test(newPass) ||
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass)
    ) {
      setPassError('New password must include uppercase, lowercase, numbers, and special symbols.');
      return;
    }
    if (currPass === newPass) {
      setPassError('New password must be different from current password.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New password confirmation does not match. Please verify.');
      return;
    }
    setIsChangingPass(true);
    try {
      await changePassword(currPass, newPass);
      setPassMsg('Password changed successfully! All prior sessions have been revoked. Logging out for re-authentication...');
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(async () => {
        setIsPasswordAccordionOpen(false);
        setShowProfileModal(false);
        await handleLogout();
      }, 1800);
    } catch (err: any) {
      setPassError(err.message || 'Unable to update password. Please verify your current password.');
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

  const handleDownloadBackup = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/system/backup', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (!res.ok) throw new Error('Unable to download backup. Please check administrator privileges.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wanderers_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Backup download error');
    }
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
      <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] flex flex-col justify-between font-sans">
        {/* Synchronized Header Bar */}
        <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-[#C9A45C]/25 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 mr-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-md shadow-[#C9A45C]/20 shrink-0">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <span className="font-brand-display text-[13px] min-[360px]:text-sm sm:text-lg md:text-xl font-bold tracking-[0.05em] min-[360px]:tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.18em] text-white block uppercase whitespace-nowrap">
                    {settings?.brandName || "Wanderer's Journeys"}
                  </span>
                  <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs tracking-normal sm:tracking-wider text-[#C9A45C] font-light block italic truncate max-w-[155px] min-[360px]:max-w-[210px] sm:max-w-none">
                    {settings?.slogan || 'Where curiosity leads, possibilities unfold'}
                  </span>
                </div>
              </div>

              {/* Back to Public Website CTA */}
              <button
                type="button"
                onClick={onBackToWebsite}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 hover:border-[#C9A45C] transition-all cursor-pointer shadow-sm hover:shadow-md shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9A45C]" />
                <span className="hidden xs:inline">Back to Website</span>
                <span className="xs:hidden">Website</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Centered Login Section */}
        <main className="flex-1 flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md mx-auto">
            {/* Login Card */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-9 shadow-xl relative overflow-hidden">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-md shadow-[#C9A45C]/20 mx-auto mb-3.5">
                  <Lock className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A]">
                  Admin Portal Login
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-light mt-1">
                  Wanderer's Journeys • Executive Management Portal
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Standard Login Form with Show/Hide Password Eye Toggle */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="name@wanderersjourneys.com"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 text-sm focus:outline-none focus:border-[#C9A45C] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full pl-4 pr-11 py-3 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 text-sm focus:outline-none focus:border-[#C9A45C] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
                  {isSubmittingLogin ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              {/* Security Badge Indicator */}
              <div className="mt-6 pt-4 border-t border-stone-200 text-center">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Shield className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>TLS 1.3 Encrypted Session • Role-Based Access Control</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Login Footer */}
        <footer className="bg-[#0B1120] text-white border-t border-slate-800 py-5 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {settings?.copyright || '© 2026 Wanderer’s Journeys Hospitality Ltd. All rights reserved.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-400 font-light">
              <span>{settings?.contactEmail || 'info@wanderersjourneys.com'}</span>
              <span aria-hidden="true">•</span>
              <span>{settings?.contactPhone || '+84 (0) 28 3822 5588'}</span>
              {onOpenPrivacy && <><span aria-hidden="true">•</span><button type="button" onClick={onOpenPrivacy} className="hover:text-[#C9A45C] transition-colors">Privacy Policy</button></>}
              {onOpenTerms && <><span aria-hidden="true">•</span><button type="button" onClick={onOpenTerms} className="hover:text-[#C9A45C] transition-colors">Terms of Service</button></>}
            </div>
          </div>
        </footer>
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

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setProfileFullName(user?.fullName || '');
              setShowProfileModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-[#C9A45C] bg-slate-800/80 hover:bg-slate-750 text-xs text-slate-200 transition-colors cursor-pointer"
            title="Account Information & Security Profile"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span className="hidden sm:inline">Account Information</span>
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

          {/* Desktop Sidebar Bottom Controls (Duplicate Account Information removed) */}
          <div className="pt-4 mt-6 border-t border-stone-200 space-y-2">
            <button
              type="button"
              onClick={onBackToWebsite}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:border-[#C9A45C] text-xs font-semibold text-slate-700 hover:text-[#0F172A] hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Back to Main Website</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
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
              <div className="p-4 border-t border-stone-200 bg-[#FDFBF7] space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToWebsite();
                  }}
                  className="w-full py-2.5 rounded-xl border-2 border-slate-300 hover:border-[#C9A45C] bg-white text-xs font-bold text-slate-800 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 text-[#C9A45C]" />
                  <span>Back to Main Website</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
          {/* Active section breadcrumb on mobile for instant clarity */}
          <div className="md:hidden bg-[#FDFBF7] px-3.5 py-2 border-b border-stone-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <span className="font-semibold text-slate-800">
              Active View: <span className="text-[#A77A32]">{visibleNavItems.find(i => i.id === activeNav)?.label}</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Role: <span className="font-mono text-slate-700 font-bold">{user?.role}</span>
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

      {/* Account Profile & Password Modal */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#A77A32] flex items-center justify-center text-[#0F172A] shadow-xs">
                  <UserCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0F172A]">
                    Account Information
                  </h3>
                  <p className="text-xs text-slate-500 font-light">
                    Manage profile identity, security credentials, and role privileges
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setIsPasswordAccordionOpen(false);
                  setProfileMsg(null);
                  setPassMsg(null);
                  setPassError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Alert Message */}
            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* 1. Account Profile View & Edit */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-slate-700">Display Full Name</label>
                <input
                  type="text"
                  required
                  value={profileFullName}
                  onChange={e => setProfileFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C9A45C]"
                  placeholder="Enter full name..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-500">Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-slate-600 font-mono cursor-not-allowed text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-500">User ID</label>
                  <input
                    type="text"
                    disabled
                    value={user?.id || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-slate-600 font-mono cursor-not-allowed text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7] border border-stone-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Role & Privileges:</span>
                  <span className="font-bold text-slate-800 text-xs">{user?.role}</span>
                </div>
                {getRoleBadge()}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>

            {/* 2. Collapsible Accordion for Change Password */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setIsPasswordAccordionOpen(!isPasswordAccordionOpen)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#A77A32]" />
                  <span className="text-xs font-bold text-[#0F172A]">
                    Change Account Password
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {isPasswordAccordionOpen ? 'Collapse' : 'Expand'}
                  </span>
                  {isPasswordAccordionOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>

              {isPasswordAccordionOpen && (
                <div className="p-4 sm:p-5 border-t border-stone-200 space-y-4 animate-in fade-in duration-150">
                  <p className="text-[11px] text-slate-500 font-light">
                    For enterprise security, successfully changing your password revokes all active sessions across devices. You will be required to sign in again.
                  </p>

                  {passMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passMsg}</span>
                    </div>
                  )}
                  {passError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrPass ? 'text' : 'password'}
                          required
                          value={currPass}
                          onChange={e => setCurrPass(e.target.value)}
                          placeholder="Enter current password..."
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrPass(!showCurrPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        >
                          {showCurrPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">New Password (Min. 8 characters)</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                          placeholder="Enter new strong password..."
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={confirmPass}
                          onChange={e => setConfirmPass(e.target.value)}
                          placeholder="Re-enter new password to confirm..."
                          className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-stone-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setIsPasswordAccordionOpen(false)}
                        className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPass}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#A77A32] text-[#0F172A] text-xs font-bold hover:from-[#d8b368] hover:to-[#b8893d] cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isChangingPass ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
