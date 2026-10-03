"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  X,
  LogIn,
  KeyRound,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Compass,
  Layers,
  Lock,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setLoginModalOpen,
    users,
    currentUser,
    setCurrentUser,
    setUserManagementOpen,
    addNotification,
  } = useAppStore();

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isLoginModalOpen) return null;

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const targetUser = users.find(
      (u) => u.email.toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg("User account not found. Check email or use 1-Click Role Switch.");
      return;
    }

    const trimmedEntered = passwordInput.trim();
    const storedPass = (targetUser.password || "").trim();
    if (storedPass && storedPass !== trimmedEntered) {
      setErrorMsg("Incorrect password. Please try again.");
      return;
    }

    setCurrentUser(targetUser);
    setSuccessMsg(`Welcome back, ${targetUser.name}!`);

    addNotification({
      title: "User Switched 🟢",
      message: `Logged in as ${targetUser.name} (${targetUser.role.replace("_", " ")}).`,
      type: "general",
    });

    setTimeout(() => {
      setSuccessMsg("");
      setLoginModalOpen(false);
    }, 800);
  };

  const handleQuickSwitch = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      addNotification({
        title: "Account Switched 🟢",
        message: `Active profile: ${targetUser.name} (${targetUser.role.replace("_", " ")}).`,
        type: "general",
      });
      setLoginModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] text-slate-100 relative"
      >
        {/* Subtle Architectural Blueprint Background inside modal */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none filter invert contrast-125"
          style={{ backgroundImage: "url('/kitchen-blueprint.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/60 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Account Login & Switcher</span>
                <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                  Architectural Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400">Select employee role or sign in with credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              onClick={() => setLoginModalOpen(false)}
              className="px-2.5 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 font-bold text-[11px] border border-brand-500/30 flex items-center gap-1 transition-all"
              title="Open Fullscreen Architecture Login Page"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={() => setLoginModalOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] relative z-10">
          {/* Quick Account Switcher Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1-Click Role Direct Switch
              </label>
              {(currentUser.role === "admin" || currentUser.role === "director") && (
                <button
                  onClick={() => {
                    setLoginModalOpen(false);
                    setUserManagementOpen(true);
                  }}
                  className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Manage Users
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users.map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleQuickSwitch(u.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all group ${
                      isSelected
                        ? "border-brand-500 bg-brand-500/15 shadow-md shadow-brand-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">{u.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-400 capitalize block truncate">
                        {u.role.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="absolute bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase">
              Or Login with Credentials
            </span>
          </div>

          {/* Email / Password Login Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. alex.morgan@acme.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Password</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
