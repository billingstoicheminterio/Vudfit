import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Plus, Trash2, Edit2, ShieldAlert, Key, 
  UserCheck, RefreshCw, Eye, EyeOff, Shield, ShieldCheck, 
  User, Sparkles, Ruler, Check
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Credentials = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal control states
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'reset_pwd'
  const [selectedUser, setSelectedUser] = useState(null);

  // Custom Units Management State
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [customUnits, setCustomUnits] = useState([]);
  const [newUnitInput, setNewUnitInput] = useState('');

  const standardUnitsList = ['box', 'drum', 'feet', 'kgs', 'mtr', 'nos', 'pair', 'pcs', 'pkt', 'rft', 'set', 'sheet', 'sqf', 'sqm'];

  useEffect(() => {
    loadCustomUnits();
  }, []);

  const loadCustomUnits = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('vudfit_custom_units') || '[]');
      setCustomUnits(stored);
    } catch (e) {
      setCustomUnits([]);
    }
  };

  const handleAddCustomUnit = (e) => {
    e.preventDefault();
    const trimmed = newUnitInput.trim().toLowerCase();
    if (!trimmed) return;

    if (standardUnitsList.includes(trimmed) || customUnits.includes(trimmed)) {
      showNotification(`Unit '${trimmed}' already exists in the system.`, 'error');
      return;
    }

    const updated = [...customUnits, trimmed];
    setCustomUnits(updated);
    localStorage.setItem('vudfit_custom_units', JSON.stringify(updated));
    setNewUnitInput('');
    showNotification(`Added new measurement unit: '${trimmed}'`, 'success');
  };

  const handleRemoveCustomUnit = (unitToRemove) => {
    const updated = customUnits.filter(u => u !== unitToRemove);
    setCustomUnits(updated);
    localStorage.setItem('vudfit_custom_units', JSON.stringify(updated));
    showNotification(`Removed custom unit: '${unitToRemove}'`, 'success');
  };

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts directory.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(password);
    showNotification('Generated secure password!', 'success');
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormUsername('');
    setFormFullName('');
    setFormRole('staff');
    setFormPassword('');
    setShowPassword(false);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setFormFullName(user.full_name);
    setFormRole(user.role);
  };

  const handleOpenResetModal = (user) => {
    setSelectedUser(user);
    setModalMode('reset_pwd');
    setFormPassword('');
    setShowPassword(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formUsername.trim() || !formFullName.trim() || !formPassword.trim()) {
      showNotification('Please fill in all user profile fields.', 'error');
      return;
    }

    try {
      await api.post('/auth/users', {
        username: formUsername.trim().toLowerCase(),
        full_name: formFullName.trim(),
        role: formRole,
        password: formPassword.trim()
      });
      showNotification(`Successfully registered user ${formUsername}`);
      setModalMode(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to create user account.';
      showNotification(detail, 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!formFullName.trim()) {
      showNotification('Full name cannot be empty.', 'error');
      return;
    }

    try {
      await api.put(`/auth/users/${selectedUser.id}`, {
        full_name: formFullName.trim(),
        role: formRole
      });
      showNotification(`Updated details for ${selectedUser.username}`);
      setModalMode(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to update user profile.';
      showNotification(detail, 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formPassword.trim()) {
      showNotification('Password field cannot be empty.', 'error');
      return;
    }

    try {
      await api.put(`/auth/users/${selectedUser.id}`, {
        password: formPassword.trim()
      });
      showNotification(`Successfully updated password for ${selectedUser.username}`);
      setModalMode(null);
    } catch (err) {
      console.error(err);
      showNotification('Failed to reset user password.', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.username === 'master') {
      showNotification('Cannot deactivate the master administrator account.', 'error');
      return;
    }

    try {
      await api.put(`/auth/users/${user.id}`, {
        is_active: !user.is_active
      });
      showNotification(`Updated status for ${user.username}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showNotification('Failed to toggle active status.', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'master') {
      showNotification('Cannot delete the master administrator account.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the user account for '${user.username}'?`)) {
      try {
        await api.delete(`/auth/users/${user.id}`);
        showNotification(`Deleted user account for ${user.username}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        const detail = err.response?.data?.detail || 'Failed to delete user account.';
        showNotification(detail, 'error');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'master':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-brand-400 border border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    }
  };

  const getUserIcon = (role) => {
    if (role === 'master') return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/10 dark:border-brand-500/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-premium dark:shadow-premium-dark bg-gradient-to-r from-white via-white to-brand-500/5 dark:from-forest-950 dark:to-brand-500/5 select-none">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping"></span>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-brand-600 dark:text-brand-400">Security Control</span>
          </div>
          <h3 className="text-3xl font-black font-luxury-title tracking-wide text-forest-900 dark:text-white leading-none">
            Credentials Directory
          </h3>
          <p className="text-xs text-slate-500 dark:text-forest-400 font-medium">
            Reset employee passwords, update operational roles, and toggle terminal permissions.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setShowUnitsModal(true)}
            className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-forest-100 dark:bg-forest-900/60 hover:bg-forest-200 dark:hover:bg-forest-850 text-forest-900 dark:text-forest-200 font-bold text-sm shadow-sm transition-all cursor-pointer border border-forest-200 dark:border-forest-800"
          >
            <Ruler className="w-4 h-4 text-brand-500" />
            <span>Manage Product Units</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-450 hover:to-brand-550 text-forest-950 font-bold text-sm shadow-lg shadow-brand-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-brand-500/20"
          >
            <Plus className="w-5 h-5 text-forest-950" />
            <span>Register New Account</span>
          </button>
        </div>

        {/* Diagonal background accent */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-brand-500/10 to-transparent transform skew-x-12 translate-x-20 pointer-events-none"></div>
      </div>

      {/* Action alerts */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center space-x-3 fade-in shadow-md">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center space-x-3 fade-in shadow-md">
          <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span>{error}</span>
        </div>
      )}

      {/* 2. User listing list */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="glass-panel border border-brand-500/10 dark:border-brand-500/15 rounded-3xl overflow-hidden shadow-premium dark:shadow-premium-dark wood-accent-top fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-forest-50/40 dark:bg-forest-950/40 border-b border-forest-100 dark:border-forest-900/60 text-forest-600 dark:text-forest-400 font-bold text-xs uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Username ID</th>
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Access Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Key Resets</th>
                  <th className="px-6 py-4 text-right">System Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-100/80 dark:divide-forest-900/40">
                {users.map((u) => {
                  const isSelf = currentUser?.username === u.username;
                  return (
                    <tr key={u.id} className={`hover:bg-forest-100/20 dark:hover:bg-forest-900/15 transition-colors ${!u.is_active ? 'opacity-70' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-slate-350 dark:bg-forest-700"></span>
                          <span>{u.username}</span>
                          {isSelf && (
                            <span className="text-[9px] font-extrabold bg-slate-200 dark:bg-forest-900 text-slate-600 dark:text-forest-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-forest-800 uppercase tracking-wide">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-forest-900 dark:text-white">{u.full_name}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm bg-white dark:bg-forest-950/50">
                          {getUserIcon(u.role)}
                          <span className={`px-1.5 py-0.5 rounded-md ${getRoleBadge(u.role)}`}>{u.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.username === 'master'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25 cursor-pointer'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25 hover:bg-slate-500/25 cursor-pointer'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenResetModal(u)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-forest-200 dark:border-forest-800 hover:border-brand-500/40 bg-white dark:bg-forest-950/40 hover:bg-brand-500 hover:text-forest-950 dark:hover:text-forest-950 text-slate-600 dark:text-forest-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-brand-500/5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Change Password</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit User Profile"
                            className="p-2.5 text-slate-500 hover:text-brand-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-forest-100 dark:hover:border-forest-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.username === 'master'}
                            title={u.username === 'master' ? "Cannot delete master account" : "Delete Account"}
                            className="p-2.5 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-forest-100 dark:hover:bg-forest-900 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-transparent hover:border-forest-100 dark:hover:border-forest-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Reset Password */}
      {modalMode === 'reset_pwd' && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-brand-500/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-zoom-in">
            <h4 className="text-xl font-bold text-forest-900 dark:text-white flex items-center space-x-2.5 mb-2">
              <KeyRound className="w-5.5 h-5.5 text-brand-500" />
              <span>Reset Password: {selectedUser.username}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-forest-400 mb-6 font-medium">Enter a new secure password for this user's terminal session login.</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">New Password</label>
                <div className="flex items-center relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                    placeholder="Enter new password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-forest-100 dark:border-forest-900/60 mt-6">
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="px-3.5 py-2.5 rounded-xl border border-forest-200 dark:border-forest-850 text-slate-700 dark:text-forest-300 hover:bg-[#c5a059]/10 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/40 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 bg-white dark:bg-forest-950/30 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Generate Key</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 text-slate-600 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-450 hover:to-brand-550 text-forest-950 font-bold text-xs shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Register New User */}
      {modalMode === 'add' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-brand-500/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-zoom-in">
            <h4 className="text-xl font-bold text-forest-900 dark:text-white flex items-center space-x-2.5 mb-2">
              <Plus className="w-5.5 h-5.5 text-brand-500" />
              <span>Register User Profile</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-forest-400 mb-6 font-medium">Create a secure login credentials profile for warehouse employees.</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                  placeholder="e.g. rushil"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                  placeholder="e.g. Rushil Patel"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Access Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                >
                  <option value="staff">Staff (Warehouse Operator)</option>
                  <option value="admin">Admin (System Administrator)</option>
                  <option value="master">Master (Owner/Full access)</option>
                </select>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Password</label>
                <div className="flex items-center relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                    placeholder="Enter secure password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-forest-100 dark:border-forest-900/60 mt-6">
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="px-3.5 py-2.5 rounded-xl border border-forest-200 dark:border-forest-855 text-slate-700 dark:text-forest-300 hover:bg-[#c5a059]/10 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/40 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 bg-white dark:bg-forest-950/30 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Generate Key</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 text-slate-600 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-450 hover:to-brand-550 text-forest-950 font-bold text-xs shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Profile Details */}
      {modalMode === 'edit' && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-brand-500/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-zoom-in">
            <h4 className="text-xl font-bold text-forest-900 dark:text-white flex items-center space-x-2.5 mb-2">
              <Edit2 className="w-5.5 h-5.5 text-brand-500" />
              <span>Edit User Profile: {selectedUser.username}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-forest-400 mb-6 font-medium">Modify employee profile details and station access level.</p>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white font-medium"
                  placeholder="Employee Full Name..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-forest-400">Access Role</label>
                <select
                  value={formRole}
                  disabled={selectedUser.username === 'master'}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <option value="staff">Staff (Warehouse Operator)</option>
                  <option value="admin">Admin (System Administrator)</option>
                  <option value="master">Master (Owner/Full access)</option>
                </select>
                {selectedUser.username === 'master' && (
                  <p className="text-[10px] text-amber-500 font-semibold mt-1">Cannot change the role of the master account.</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-forest-100 dark:border-forest-900/60 mt-6">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-800 text-slate-600 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-450 hover:to-brand-550 text-forest-950 font-bold text-xs shadow-md shadow-brand-500/10 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Manage Measurement Units */}
      {showUnitsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-brand-500/15 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-zoom-in">
            <h4 className="text-xl font-bold text-forest-900 dark:text-white flex items-center space-x-2.5 mb-2">
              <Ruler className="w-5.5 h-5.5 text-brand-500" />
              <span>Manage Product Measurement Units</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-forest-400 mb-6 font-medium">
              Create, view, or remove custom units used across Product Catalogue, Inward, Outward, and POs.
            </p>

            {/* Quick Add Form */}
            <form onSubmit={handleAddCustomUnit} className="mb-6 flex space-x-2">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Type new unit name (e.g. bundle, carton, roll)..."
                className="flex-1 px-4 py-2.5 bg-white/50 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm dark:text-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-forest-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Unit</span>
              </button>
            </form>

            {/* Unit Lists */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-forest-400 mb-2">
                  System Standard Units ({standardUnitsList.length})
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {standardUnitsList.map((unit) => (
                    <span
                      key={unit}
                      className="px-2.5 py-1 bg-forest-100 dark:bg-forest-950 border border-forest-200 dark:border-forest-800 text-forest-800 dark:text-forest-300 font-mono text-xs rounded-lg font-bold"
                    >
                      {unit}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
                  Custom User Units ({customUnits.length})
                </h5>
                {customUnits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customUnits.map((unit) => (
                      <span
                        key={unit}
                        className="px-3 py-1 bg-brand-500/10 dark:bg-brand-950/40 border border-brand-500/30 text-brand-700 dark:text-brand-300 font-mono text-xs rounded-lg font-bold flex items-center space-x-1.5"
                      >
                        <span>{unit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomUnit(unit)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title={`Delete unit ${unit}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom units added yet. Type a unit name above to create one.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-forest-100 dark:border-forest-900/60 mt-6">
              <button
                type="button"
                onClick={() => setShowUnitsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-forest-200 dark:bg-forest-800 text-forest-900 dark:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Credentials;
