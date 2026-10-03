"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { BrandSettingsModal, ICON_MAP } from "@/components/settings/BrandSettingsModal";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Target,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Settings,
  Briefcase,
  Sparkles,
  Palette,
  MessageCircle,
  Compass,
  CalendarCheck,
  ShieldCheck,
  LogOut,
  KeyRound,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    projects,
    activeProjectId,
    setActiveProject,
    isSidebarCollapsed,
    toggleSidebar,
    setCreateProjectOpen,
    currentUser,
    users,
    brandSettings,
    setBrandSettingsOpen,
    setUserManagementOpen,
    setChangePasswordOpen,
    setChatOpen,
    setActiveChatUser,
    taskFilterUser,
    setTaskFilterUser,
    logout,
    chatMessages,
  } = useAppStore();

  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
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

  const totalUnreadCount = chatMessages.filter((m) => {
    if (m.isRead) return false;
    const isReceiver =
      m.receiverId === currentUser?.id ||
      (currentUser?.email && m.receiverEmail?.toLowerCase() === currentUser?.email.toLowerCase());
    return isReceiver;
  }).length;

  const getMemberUnreadCount = (memberId: string, memberEmail?: string) => {
    return chatMessages.filter((m) => {
      if (m.isRead) return false;
      const isReceiver =
        m.receiverId === currentUser?.id ||
        (currentUser?.email && m.receiverEmail?.toLowerCase() === currentUser?.email.toLowerCase());
      const isSender =
        m.senderId === memberId ||
        (memberEmail && m.senderEmail?.toLowerCase() === memberEmail.toLowerCase());
      return isReceiver && isSender;
    }).length;
  };

  const mainNavItems = isSecurity
    ? [
        { label: "Gate Attendance Desk", href: "/attendance", icon: ShieldCheck },
      ]
    : [
        { label: "Overview Dashboard", href: "/", icon: LayoutDashboard },
        ...(canAccessCRM ? [{ label: "CRM Sales Pipeline", href: "/crm", icon: Target }] : []),
        { label: "Attendance & Hours", href: "/attendance", icon: CalendarCheck },
      ];

  const SelectedIcon = ICON_MAP[brandSettings.logoIcon] || Sparkles;

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300 z-30 select-none",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border justify-between bg-card">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2.5 min-w-0 py-1">
              <img
                src={brandSettings.logoImageUrl || "/vudfit-logo.png"}
                alt={brandSettings.brandName || "VUDFIT"}
                className="h-10 w-auto object-contain max-w-[180px]"
              />
            </Link>

            <button
              onClick={() => setBrandSettingsOpen(true)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-brand-500 transition-colors shrink-0"
              title="Customize Logo, Brand Name & Color Theme"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setBrandSettingsOpen(true)}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto shadow-sm border border-border overflow-hidden p-1"
            title="VUDFIT Official Logo"
          >
            <img
              src={brandSettings.logoImageUrl || "/vudfit-logo.png"}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </button>
        )}
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
        {/* Core Nav */}
        <div className="space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main Menu
            </div>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <button
            onClick={() => setChatOpen(true)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 mt-1 relative"
            )}
            title={isSidebarCollapsed ? "Team Chat" : undefined}
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 shrink-0 fill-emerald-500/20" />
              {!isSidebarCollapsed && <span className="font-semibold">Team Chat</span>}
            </div>
            {totalUnreadCount > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0 animate-pulse shadow-sm",
                  isSidebarCollapsed && "absolute -top-1 -right-1"
                )}
              >
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Projects Section */}
        {!isSecurity && (
          <div className="space-y-1">
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between px-3 mb-1">
                <button
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>Department ({projects.length})</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      !isProjectsExpanded && "-rotate-90"
                    )}
                  />
                </button>
                <button
                  onClick={() => setCreateProjectOpen(true)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Create New Department"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center py-2">
                <FolderKanban className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {(isProjectsExpanded || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {projects.map((proj) => {
                  const isProjActive = pathname === `/projects/${proj.id}`;
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      onClick={() => setActiveProject(proj.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                        isProjActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                      title={isSidebarCollapsed ? proj.name : undefined}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: proj.color }}
                      />
                      {!isSidebarCollapsed && (
                        <span className="truncate flex-1 text-left">{proj.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Team Members Widget */}
        {!isSidebarCollapsed && (
          <div className="pt-2 border-t border-border/40">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Team ({otherTeamMembers.length})
              </span>
              {canManageUsers && (
                <button
                  onClick={() => setUserManagementOpen(true)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-brand-500 transition-colors"
                  title="Create & Manage Users (Admin/Director)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {otherTeamMembers.map((usr) => {
                const memberUnread = getMemberUnreadCount(usr.id, usr.email);
                return (
                  <button
                    key={usr.id}
                    onClick={() => {
                      setActiveChatUser(usr.id);
                      setChatOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group text-foreground hover:bg-secondary/70 hover:text-brand-500 text-left"
                    title={`Start direct chat with ${usr.name}`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={usr.avatar}
                        alt={usr.name}
                        className="w-6 h-6 rounded-full object-cover border border-border"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-card" />
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <span className={cn("truncate block text-xs", memberUnread > 0 ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
                        {usr.name}
                      </span>
                    </div>
                    {memberUnread > 0 ? (
                      <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shrink-0 animate-pulse shadow-sm shadow-emerald-500/40">
                        {memberUnread}
                      </span>
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-border flex flex-col gap-1.5">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-secondary/40 border border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-full object-cover border border-brand-500 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground truncate block leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block capitalize">
                  {currentUser?.role?.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-secondary transition-colors"
                title="Change Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setChangePasswordOpen(true)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-brand-500 hover:bg-secondary transition-colors"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="w-full flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Download Android APK Button */}
        {!isSidebarCollapsed ? (
          <a
            href="/downloads/VudfitSmart.apk"
            download="VudfitSmart.apk"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all shadow-sm group"
            title="Download Android APK"
          >
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="truncate">Android App (.apk)</span>
          </a>
        ) : (
          <a
            href="/downloads/VudfitSmart.apk"
            download="VudfitSmart.apk"
            className="w-full flex items-center justify-center p-2 rounded-xl text-emerald-500 hover:bg-emerald-600/20 transition-colors"
            title="Download Android APK"
          >
            <Smartphone className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-medium"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <BrandSettingsModal />
    </aside>
  );
};
