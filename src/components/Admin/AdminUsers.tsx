import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, CheckCircle, Ban, RefreshCw, KeyRound, Eye, EyeOff, Copy, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import { User, UserRole } from '../../types';
import { fetchAdminUsers, createAdminUser, toggleAdminUserStatus, resetAdminUserPassword, deleteAdminUser } from '../../api';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newRole, setNewRole] = useState<UserRole>('LEAD_MANAGER');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset / Update Password State
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState<string>('');
  const [resetPasswordConfirmVal, setResetPasswordConfirmVal] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState<boolean>(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);
  const [copiedResetPassword, setCopiedResetPassword] = useState<boolean>(false);

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadUsers = () => {
    setLoading(true);
    fetchAdminUsers()
      .then(res => setUsers(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createAdminUser({
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        password: newPassword,
        role: newRole,
      });
      setShowAddModal(false);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      triggerToast('Staff account created successfully.');
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleAdminUserStatus(user.id, !user.isActive);
      triggerToast(`Account status updated for ${user.fullName}.`);
      loadUsers();
    } catch (err: any) {
      triggerToast(err.message || 'Cannot modify account status.');
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let res = 'WJ-';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordVal(res);
    setResetPasswordConfirmVal(res);
  };

  const handleOpenResetModal = (u: User) => {
    setResettingUser(u);
    setResetPasswordVal('');
    setResetPasswordConfirmVal('');
    setShowResetPassword(false);
    setShowResetPasswordConfirm(false);
    setResetMsg(null);
    setCopiedResetPassword(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (resetPasswordVal.length < 8) {
      setResetMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (resetPasswordVal !== resetPasswordConfirmVal) {
      setResetMsg({ type: 'error', text: 'Password confirmation does not match. Please verify and try again.' });
      return;
    }

    setIsSubmittingReset(true);
    setResetMsg(null);
    try {
      await resetAdminUserPassword(resettingUser.id, resetPasswordVal);
      setResetMsg({
        type: 'success',
        text: `New password assigned to ${resettingUser.fullName} (${resettingUser.email}).`,
      });
      triggerToast(`Password updated successfully for ${resettingUser.fullName}.`);
      setTimeout(() => {
        setResettingUser(null);
        setResetPasswordVal('');
        setResetPasswordConfirmVal('');
        setResetMsg(null);
      }, 1800);
    } catch (err: any) {
      setResetMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      await deleteAdminUser(deletingUser.id);
      triggerToast(`Account for ${deletingUser.fullName} was permanently deleted.`);
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete user account.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F172A]">Staff & Account Access</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            Role-Based Access Control (RBAC) across Admin, Manager, and Concierge Lead Managers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4 text-[#C9A45C]" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleCreateUser} className="p-6 rounded-3xl bg-[#FDFBF7] border-2 border-[#C9A45C]/50 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#0F172A]">Provision New Staff Account</h3>
          {errorMsg && <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">{errorMsg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="sarah@wanderersjourneys.com"
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Temporary Initial Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-2.5 pr-9 py-2.5 rounded-lg border border-stone-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="font-semibold block mb-1">Assigned RBAC Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as UserRole)}
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-medium"
              >
                <option value="LEAD_MANAGER">Lead Manager (Concierge Inquiries only)</option>
                <option value="MANAGER">Manager (CMS Content + Leads)</option>
                <option value="ADMIN">Admin (Full System & User Control)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
            >
              Provision Account
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-stone-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#0F172A]">{u.fullName}</div>
                    <div className="text-slate-400 text-xs">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-stone-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-semibold">
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{u.id}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role === 'ADMIN' ? (
                        <span
                          className="px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] font-medium text-slate-500 border border-stone-200"
                          title="Administrator accounts must update their password through Account Profile with current password verification."
                        >
                          Self-Managed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenResetModal(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Assign new password for staff account"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#C9A45C]" />
                          <span>Set Password</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          u.isActive !== false
                            ? 'border border-stone-200 hover:bg-rose-50 text-rose-600'
                            : 'border border-emerald-300 hover:bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                      </button>

                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                        title={`Delete ${u.fullName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack (< 768px) */}
        <div className="md:hidden divide-y divide-stone-100">
          {users.map(u => (
            <div key={u.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0F172A] text-sm">{u.fullName}</div>
                  <div className="text-slate-500 text-xs">{u.email}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  u.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : u.role === 'MANAGER'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-stone-100 text-slate-700'
                }`}>
                  {u.role}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">{u.id}</span>
                  <span>•</span>
                  {u.isActive !== false ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Suspended
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {u.role === 'ADMIN' ? (
                    <span className="px-2 py-1 rounded-lg bg-stone-100 text-[10px] font-medium text-slate-500 border border-stone-200">
                      Self-Managed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenResetModal(u)}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-[11px] font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-[#C9A45C]" />
                      <span>Set Password</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      u.isActive !== false
                        ? 'border border-stone-200 hover:bg-rose-50 text-rose-600'
                        : 'border border-emerald-300 hover:bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                  </button>

                  <button
                    onClick={() => setDeletingUser(u)}
                    className="p-1 rounded-lg border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title={`Delete ${u.fullName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#C9A45C]" />
                  <span>Assign New Password</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign a new password for staff member <strong className="text-slate-800">{resettingUser.fullName}</strong> ({resettingUser.email}).
                </p>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  resetMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {resetMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{resetMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] font-semibold text-[#A77A32] hover:text-[#C9A45C] hover:underline cursor-pointer"
                  >
                    + Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetPasswordVal}
                    onChange={e => setResetPasswordVal(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)..."
                    className="w-full p-2.5 pr-20 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A45C]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                    {resetPasswordVal && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(resetPasswordVal);
                          setCopiedResetPassword(true);
                          setTimeout(() => setCopiedResetPassword(false), 2000);
                        }}
                        className="p-1 hover:text-slate-700 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedResetPassword ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-1 hover:text-slate-700 cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showResetPasswordConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetPasswordConfirmVal}
                    onChange={e => setResetPasswordConfirmVal(e.target.value)}
                    placeholder="Re-enter new password to confirm..."
                    className="w-full p-2.5 pr-10 rounded-xl border border-stone-300 bg-stone-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A45C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showResetPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                All prior active sessions for this staff member will be immediately revoked for security.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  disabled={isSubmittingReset}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>{isSubmittingReset ? 'Saving...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-lg text-[#0F172A]">Delete Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-900">{deletingUser.fullName}</strong> ({deletingUser.email})?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
              <p className="font-semibold">Security Safeguards Active:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>All active sessions and tokens will be immediately revoked.</li>
                <li>Self-deletion and deletion of the last remaining admin are strictly prohibited.</li>
                <li>This administrative action is logged to the immutable security audit ledger.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUserConfirm}
                disabled={isDeletingUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingUser ? 'Deleting...' : 'Confirm Permanent Deletion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
