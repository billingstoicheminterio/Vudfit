"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { User, UserRole, UserPermissions } from "@/lib/types";
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Mail,
  User as UserIcon,
  Building2,
  Power,
  KeyRound,
  Eye,
  EyeOff,
  Sliders,
  Lock,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
];

const ROLE_OPTIONS: { role: UserRole; label: string; description: string }[] = [
  { role: "admin", label: "Admin", description: "Full system access & user management permissions" },
  { role: "director", label: "Director", description: "Executive leadership with full CRM & financial pipeline access" },
  { role: "manager", label: "Manager", description: "Executive management with full director rights, CRM & task approvals" },
  { role: "team_leader", label: "Team Leader", description: "Lead team members, assign tasks, manage deadlines & handoffs" },
  { role: "team_member", label: "Team Member", description: "Work on assigned tasks & log time" },
  { role: "security", label: "Security Guard (Gate)", description: "Gate in/out attendance marking & time logging rights only" },
];

export const UserManagementModal: React.FC = () => {
  const {
    isUserManagementOpen,
    setUserManagementOpen,
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    addNotification,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("team_member");
  const [department, setDepartment] = useState("Production & Sales");
  const [phone, setPhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  
  // Permission Rights Form State
  const [canViewAllTasks, setCanViewAllTasks] = useState(false);
  const [departmentAccess, setDepartmentAccess] = useState<"all" | "own_department_only">("own_department_only");

  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAdminChangeUserPassword = (userId: string, customPass?: string) => {
    const finalPass = customPass || newPasswordForUser.trim();
    if (!finalPass || finalPass.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return;

    updateUser(userId, { password: finalPass });
    setEditingPasswordUserId(null);
    setNewPasswordForUser("");
    setSuccessMessage(`Password for ${target.name} successfully updated to: "${finalPass}"`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (!isUserManagementOpen) return null;

  const canManageUsers = currentUser?.role === "admin" || currentUser?.role === "director" || currentUser?.role === "manager";

  if (!canManageUsers) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground">
              User Creation and Management is restricted to <strong>Admin</strong> and <strong>Director</strong> roles only.
            </p>
          </div>
          <button
            onClick={() => setUserManagementOpen(false)}
            className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("Password must be at least 4 characters long.");
      return;
    }

    // Add User to store with permissions
    addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      department: department.trim(),
      phone: phone.trim(),
      avatar: selectedAvatar,
      status: "active",
      permissions: {
        canViewAllTasks: role === "admin" || role === "director" || role === "manager" || role === "team_leader" ? true : canViewAllTasks,
        departmentAccess: role === "admin" || role === "director" || role === "manager" ? "all" : departmentAccess,
      },
    });

    setSuccessMessage(`User "${name}" created successfully!`);
    setName("");
    setEmail("");
    setPassword("");
    setRole("team_member");
    setPhone("");
    setCanViewAllTasks(false);
    setDepartmentAccess("own_department_only");

    setTimeout(() => {
      setSuccessMessage("");
      setActiveTab("list");
    }, 1500);
  };

  const handleToggleTaskPermission = (user: User) => {
    const currentPermissions: UserPermissions = user.permissions || {
      canViewAllTasks: user.role === "admin" || user.role === "director" || user.role === "manager" || user.role === "team_leader",
      departmentAccess: user.role === "admin" || user.role === "director" || user.role === "manager" ? "all" : "own_department_only",
    };

    updateUser(user.id, {
      permissions: {
        ...currentPermissions,
        canViewAllTasks: !currentPermissions.canViewAllTasks,
      },
    });
  };

  const handleToggleDepartmentAccess = (user: User, access: "all" | "own_department_only") => {
    const currentPermissions: UserPermissions = user.permissions || {
      canViewAllTasks: user.role === "admin" || user.role === "director" || user.role === "manager" || user.role === "team_leader",
      departmentAccess: "own_department_only",
    };

    updateUser(user.id, {
      permissions: {
        ...currentPermissions,
        departmentAccess: access,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                User Management & Permission Rights
              </h2>
              <p className="text-xs text-muted-foreground">
                Create user accounts, grant department rights, and restrict task visibility
              </p>
            </div>
          </div>

          <button
            onClick={() => setUserManagementOpen(false)}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-border bg-secondary/10 gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "list"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Users & Rights ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "create"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "list" ? (
            /* Tab 1: User List & Rights Configuration */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>Active Users ({users.filter((u) => u.status !== "inactive").length})</span>
                <span className="text-[11px] bg-brand-500/10 text-brand-500 px-2.5 py-0.5 rounded-full font-medium border border-brand-500/20">
                  Logged in as: {currentUser.name} ({currentUser.role})
                </span>
              </div>

              <div className="space-y-4">
                {users.map((user) => {
                  const canSeeAll =
                    user.role === "admin" || (user.permissions?.canViewAllTasks ?? false);
                  const deptAccess = user.permissions?.departmentAccess || "own_department_only";

                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-all space-y-3"
                    >
                      {/* Top Row: User Summary & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* User Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative group shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-brand-500/40"
                            />
                            <label
                              htmlFor={`user-avatar-upload-${user.id}`}
                              className="absolute inset-0 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Upload New Photo"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </label>
                            <input
                              id={`user-avatar-upload-${user.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    const res = evt.target?.result as string;
                                    if (res) updateUser(user.id, { avatar: res });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-foreground truncate">{user.name}</h4>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {user.department && (
                              <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-brand-500" />
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Role & Status Controls */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                          {/* Role Selector */}
                          <select
                            value={user.role}
                            onChange={(e) => {
                              const newRole = e.target.value as UserRole;
                              updateUser(user.id, { role: newRole });
                              addNotification({
                                title: "Role Updated ✅",
                                message: `${user.name}'s role updated to ${newRole.replace("_", " ").toUpperCase()}.`,
                                type: "general",
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.role} value={opt.role}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* Password Reset Button (Admin & Director) */}
                          <button
                            onClick={() => {
                              if (editingPasswordUserId === user.id) {
                                setEditingPasswordUserId(null);
                              } else {
                                setEditingPasswordUserId(user.id);
                                setNewPasswordForUser("");
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              editingPasswordUserId === user.id
                                ? "bg-brand-500 text-white border-brand-500"
                                : "bg-secondary border-border text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10"
                            }`}
                            title="Reset / Change Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            onClick={() =>
                              updateUser(user.id, {
                                status: user.status === "inactive" ? "active" : "inactive",
                              })
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              user.status === "inactive"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                            title={user.status === "inactive" ? "Activate User" : "Deactivate User"}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete User Button */}
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
                                  deleteUser(user.id);
                                  addNotification({
                                    title: "User Deleted 🗑️",
                                    message: `${user.name} has been removed.`,
                                    type: "general",
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Admin Inline Password Reset Drawer */}
                      {editingPasswordUserId === user.id && (
                        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs font-bold text-foreground">
                            <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Set New Password for {user.name}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Current: {user.password || "password123"}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={newPasswordForUser}
                              onChange={(e) => setNewPasswordForUser(e.target.value)}
                              placeholder="Enter new password (min 4 chars)"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAdminChangeUserPassword(user.id)}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
                              >
                                Save Password
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAdminChangeUserPassword(user.id, "password123")}
                                className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors"
                                title="Reset to default: password123"
                              >
                                Reset to Default
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingPasswordUserId(null)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Row: Permission Rights & Isolation Settings */}
                      <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Task Visibility Rights */}
                        <div className="p-2.5 rounded-lg bg-card/60 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {canSeeAll ? (
                              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold text-foreground block">
                                {canSeeAll ? "Can See All Team Tasks" : "Restricted: Own Tasks Only"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {canSeeAll ? "Full visibility across all tasks" : "Only sees assigned & created tasks"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleTaskPermission(user)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border ${
                              canSeeAll
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            }`}
                          >
                            {canSeeAll ? "Full Access" : "Own Tasks Only"}
                          </button>
                        </div>

                        {/* Department Rights */}
                        <div className="p-2.5 rounded-lg bg-card/60 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-foreground block">Department Rights</span>
                              <span className="text-[10px] text-muted-foreground">
                                {deptAccess === "all" ? "All Departments" : "Own Department Only"}
                              </span>
                            </div>
                          </div>

                          <select
                            value={deptAccess}
                            onChange={(e) =>
                              handleToggleDepartmentAccess(
                                user,
                                e.target.value as "all" | "own_department_only"
                              )
                            }
                            className="px-2 py-1 rounded-md bg-secondary border border-border text-[11px] font-medium text-foreground focus:outline-none"
                          >
                            <option value="all">All Departments</option>
                            <option value="own_department_only">Own Department Only</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 2: Create New User Form */
            <form onSubmit={handleCreateUser} className="space-y-5">
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Select User Avatar</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="Avatar preset"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-11 h-11 rounded-full object-cover cursor-pointer border-2 transition-all ${
                        selectedAvatar === av
                          ? "border-brand-500 scale-110 shadow-lg shadow-brand-500/20"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                  <label
                    htmlFor="custom-avatar-file-modal"
                    className="w-11 h-11 rounded-full border-2 border-dashed border-brand-500/50 hover:border-brand-500 bg-brand-500/10 text-brand-500 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 group"
                    title="Upload Custom Photo"
                  >
                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <input
                      id="custom-avatar-file-modal"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const res = evt.target?.result as string;
                            if (res) setSelectedAvatar(res);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@vudfit.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Login Password *</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set 4+ digit password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Department / Branch</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Production & CNC"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Assign Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <div
                      key={opt.role}
                      onClick={() => setRole(opt.role)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        role === opt.role
                          ? "border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/10"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-foreground">{opt.label}</span>
                        {role === opt.role && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Rights Toggles */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-brand-500" />
                  Task & Department Permission Rights
                </h4>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60 cursor-pointer">
                    <div>
                      <span className="font-semibold text-foreground block">Allow Viewing All Team Tasks</span>
                      <span className="text-[10px] text-muted-foreground">
                        If disabled, this user can ONLY see tasks assigned to them
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={canViewAllTasks}
                      onChange={(e) => setCanViewAllTasks(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </label>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/60">
                    <div>
                      <span className="font-semibold text-foreground block">Department Access Rights</span>
                      <span className="text-[10px] text-muted-foreground">Limit visibility across departments</span>
                    </div>
                    <select
                      value={departmentAccess}
                      onChange={(e) =>
                        setDepartmentAccess(e.target.value as "all" | "own_department_only")
                      }
                      className="px-2 py-1 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none"
                    >
                      <option value="all">All Departments</option>
                      <option value="own_department_only">Own Department Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-secondary transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
