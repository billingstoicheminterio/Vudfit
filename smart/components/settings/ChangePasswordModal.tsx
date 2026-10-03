"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ChangePasswordModal: React.FC = () => {
  const {
    isChangePasswordOpen,
    setChangePasswordOpen,
    currentUser,
    setCurrentUser,
    updateUser,
    addNotification,
  } = useAppStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isChangePasswordOpen || !currentUser) return null;

  const handleClose = () => {
    setChangePasswordOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Update store user list and active currentUser
      updateUser(currentUser.id, { password: newPassword.trim() });
      setCurrentUser({
        ...currentUser,
        password: newPassword.trim(),
      });

      addNotification({
        title: "Password Updated 🔑",
        message: `Your password has been changed successfully.`,
        type: "general",
      });

      setIsLoading(false);
      setSuccessMessage("Your password has been changed successfully!");

      setTimeout(() => {
        handleClose();
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden text-slate-900"
      >
        {/* Ambient top highlight */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <p className="text-[11px] text-slate-500">Update your account login password</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Summary */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
          />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs text-slate-900 block truncate">{currentUser.name}</span>
            <span className="text-[11px] text-slate-500 block truncate">{currentUser.email}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            {currentUser.role.replace("_", " ")}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
