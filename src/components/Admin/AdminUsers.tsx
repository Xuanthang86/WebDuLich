import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, CheckCircle, Ban, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import { User, UserRole } from '../../types';
import { fetchAdminUsers, createAdminUser, toggleAdminUserStatus } from '../../api';

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
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleAdminUserStatus(user.id, !user.isActive);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Cannot modify status');
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
