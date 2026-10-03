"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  LogIn,
  KeyRound,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Check,
  X,
  RefreshCw,
  Phone,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { users, login, updateUser, addNotification, brandSettings, syncUsersFromServer } = useAppStore();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");



  // Fetch all registered users from LAN server immediately when page loads
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
          syncUsersFromServer(data.users);
        }
      })
      .catch((err) => console.error("LAN fetch error on login mount:", err));
  }, [syncUsersFromServer]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    let currentUsers = users;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
        currentUsers = data.users;
        syncUsersFromServer(data.users);
      }
    } catch (err) {
      console.warn("LAN fetch fallback to store:", err);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const targetUser = currentUsers.find(
      (u) =>
        u.email.toLowerCase() === trimmedEmail ||
        (trimmedEmail === "admin" && (u.email === "admin@vudfit.com" || u.role === "admin")) ||
        (trimmedEmail === "altaf" && u.email === "altaf@vudfit.com") ||
        (trimmedEmail === "shahil" && u.email === "shahil@vudfit.com") ||
        (u.name && u.name.toLowerCase() === trimmedEmail)
    );

    if (!targetUser) {
      setIsLoading(false);
      setErrorMessage("Account with this email/user ID does not exist. Please check your email or contact Admin.");
      return;
    }

    const trimmedEnteredPass = password.trim();
    const userStoredPass = (targetUser.password || "").trim();

    // Strictly check the user's individual password only:
    const isPasswordCorrect =
      userStoredPass === trimmedEnteredPass ||
      userStoredPass === password;

    if (!isPasswordCorrect) {
      setIsLoading(false);
      setErrorMessage("Incorrect password. Please check your password or contact Admin / Director.");
      return;
    }

    login(targetUser);
    setSuccessMessage(`Authentication verified. Welcome back, ${targetUser.name}!`);

    setTimeout(() => {
      setIsLoading(false);
      if (targetUser.role === "security") {
        router.push("/attendance");
      } else {
        router.push("/");
      }
    }, 400);
  };

  const handleFillDemo = (demoEmail: string, demoPass: string = "password123") => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage("");
  };



  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. BACK OFFICE ARCHITECTURAL LINE ART BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {/* Corporate Back Office Line Art Drawing - Balanced Opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-55 filter contrast-115"
          style={{
            backgroundImage: "url('/office-lineart.jpg')",
          }}
        />

        {/* Delicate Soft Ambient Light Vignette */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-emerald-50/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_90%_at_50%_50%,transparent_0%,rgba(248,250,252,0.5)_100%)]" />

        {/* Top-Left Official Brand Logo (Only Logo) */}
        <div className="absolute top-5 left-5 sm:top-8 sm:left-8 z-20">
          <img
            src={brandSettings.logoImageUrl || "/vudfit-logo.png"}
            alt={brandSettings.brandName || "VUDFIT"}
            className="h-10 sm:h-14 w-auto object-contain select-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* 2. MAIN SPLIT SHOWCASE & PRISTINE LIGHT CARD */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Brand & Architecture Storytelling */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 space-y-6 text-left hidden lg:block"
        >
          {/* Metallic / Emerald Brand Emblem */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Enterprise Project & ERP Management
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Stoichem Interio <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 bg-clip-text text-transparent">
                {brandSettings.brandName || "VUDFIT"} Architecture Hub
              </span>
            </h1>
          </div>

          {/* Architectural Quote */}
          <div className="p-4 rounded-2xl bg-white/90 border-l-4 border-emerald-600 border border-slate-200/80 shadow-sm text-xs italic text-slate-700">
            &quot;Design is not just what it looks like and feels like. Design is how it works.&quot;
            <span className="block not-italic font-bold text-[10px] text-emerald-700 mt-1 uppercase tracking-wider">— {brandSettings.brandName || "VUDFIT"} Engineering Team</span>
          </div>
        </motion.div>

        {/* Right Column: Pristine Light Glassmorphic Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="rounded-3xl bg-white/95 border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            {/* Card Header with Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Vudfit Staff</h2>
                  <p className="text-xs text-slate-500">Enter your credentials to continue</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                🟢 Live Portal
              </span>
            </div>

            {/* ENTERPRISE EMAIL & PASSWORD LOGIN FORM */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 relative z-10">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 transition-all font-mono"
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>


            </form>

            {/* Security Guarantee Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit Encrypted Workspace</span>
              </span>

              <span className="text-[10px] text-slate-400 font-semibold">
                {brandSettings.brandName || "VUDFIT"} v2.4
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
