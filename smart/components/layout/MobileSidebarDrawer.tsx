"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  Target,
  Clock,
  FolderKanban,
  Users,
  Plus,
  Palette,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  UserCheck,
  MessageCircle,
  CalendarCheck,
  LogOut,
  KeyRound,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileSidebarDrawer: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isMobileMenuOpen,
    setMobileMenuOpen,
    projects,
    activeProjectId,
    setActiveProject,
    currentUser,
    users,
    brandSettings,
    setBrandSettingsOpen,
    setUserManagementOpen,
    setChangePasswordOpen,
    setCreateProjectOpen,
    theme,
    toggleTheme,
    taskFilterUser,
    setTaskFilterUser,
    setLoginModalOpen,
    setActiveChatUser,
    setChatOpen,
    logout,
  } = useAppStore();

  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  if (!isMobileMenuOpen) return null;

  const isSecurity = currentUser?.role === "security";
  const canAccessCRM =
    !isSecurity &&
    (currentUser?.role === "admin" ||
      currentUser?.role === "director" ||
      currentUser?.role === "manager" ||
      currentUser?.department?.toLowerCase().includes("sales") ||
      currentUser?.role === "team_leader" ||
      currentUser?.permissions?.departmentAccess === "all");
  const canManageUsers = !isSecurity && (currentUser?.role === "admin" || currentUser?.role === "director" || currentUser?.role === "manager");
  const otherTeamMembers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      u.role !== "admin" &&
      u.name?.toLowerCase() !== "admin" &&
      u.email?.toLowerCase() !== "admin@vudfit.com"
  );

  const navItems = isSecurity
    ? [
        { label: "Gate Attendance Desk", href: "/attendance", icon: ShieldCheck },
      ]
    : [
        { label: "Overview Dashboard", href: "/", icon: LayoutDashboard },
        ...(canAccessCRM ? [{ label: "CRM Sales Pipeline", href: "/crm", icon: Target }] : []),
        { label: "Attendance & Hours", href: "/attendance", icon: CalendarCheck },
      ];

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer content */}
      <aside className="fixed inset-y-0 left-0 max-w-[300px] w-full bg-card border-r border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={brandSettings.logoImageUrl || "/vudfit-logo.png"}
              alt={brandSettings.brandName || "VUDFIT"}
              className="h-9 w-auto object-contain max-w-[160px]"
            />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-3 bg-secondary/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser?.avatar || "/default-avatar.png"}
              alt={currentUser?.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-brand-500 shadow-sm"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-foreground truncate">{currentUser?.name}</h4>
              <span className="text-[10px] text-muted-foreground font-medium capitalize block">
                {currentUser?.role === "team_leader" ? "Team Leader" : currentUser?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    isActive
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Departments & Projects */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <button
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground"
              >
                <span>Departments ({projects.length})</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    !isProjectsExpanded && "-rotate-90"
                  )}
                />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCreateProjectOpen(true);
                }}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                title="Create Department"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isProjectsExpanded && (
              <div className="space-y-0.5">
                {projects.map((proj) => {
                  const isProjActive = pathname === `/projects/${proj.id}`;
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      onClick={() => {
                        setActiveProject(proj.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        isProjActive
                          ? "bg-secondary text-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: proj.color }}
                      />
                      <span className="truncate flex-1 text-left">{proj.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Team Members ({otherTeamMembers.length})
              </span>
              {canManageUsers && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setUserManagementOpen(true);
                  }}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-brand-500"
                  title="Manage Team (Admin/Director)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {otherTeamMembers.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveChatUser(usr.id);
                    setChatOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-foreground hover:bg-secondary/70 hover:text-brand-500 text-left group"
                  title={`Direct chat with ${usr.name}`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={usr.avatar}
                      alt={usr.name}
                      className="w-5 h-5 rounded-full object-cover border border-border"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-card" />
                  </div>
                  <span className="truncate flex-1 text-left group-hover:text-brand-500">{usr.name}</span>
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-emerald-500 transition-colors shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 border-t border-border bg-card/60 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-brand-500 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground truncate block leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block capitalize">
                  {currentUser?.role?.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-secondary transition-colors"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  router.push("/login");
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors text-xs font-semibold"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Download Android APK Button */}
          <a
            href="/downloads/VudfitSmart.apk"
            download="VudfitSmart.apk"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Download Android App (.apk)</span>
          </a>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setBrandSettingsOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold border border-border transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-brand-500" />
              <span>Theme</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground border border-border transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
