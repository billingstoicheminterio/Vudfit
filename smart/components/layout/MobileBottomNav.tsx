"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard,
  Target,
  Plus,
  MessageCircle,
  Menu,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const {
    currentUser,
    projects,
    setCreateTaskOpen,
    setChatOpen,
    isMobileMenuOpen,
    setMobileMenuOpen,
    notifications,
    chatMessages,
  } = useAppStore();

  const canAccessCRM =
    currentUser?.role === "admin" ||
    currentUser?.role === "director" ||
    currentUser?.role === "manager" ||
    currentUser?.department?.toLowerCase().includes("sales") ||
    currentUser?.role === "team_leader" ||
    currentUser?.permissions?.departmentAccess === "all";
  const unreadChatCount = chatMessages.filter(
    (m) => m.receiverId === currentUser?.id && !m.isRead
  ).length;

  const isHome = pathname === "/";
  const isCRM = pathname.startsWith("/crm");
  const isProjects = pathname.startsWith("/projects");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto bg-card/90 backdrop-blur-2xl border border-border/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] px-2 py-1.5 transition-transform duration-300"
    >
      <div className="flex items-center justify-around relative">
        {/* 1. Home / Dashboard */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative",
            isHome
              ? "text-brand-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground font-medium"
          )}
        >
          <LayoutDashboard className={cn("w-5 h-5 transition-transform", isHome && "scale-110")} />
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
          {isHome && (
            <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          )}
        </Link>

        {/* 2. CRM or Projects */}
        {canAccessCRM ? (
          <Link
            href="/crm"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative",
              isCRM
                ? "text-brand-500 font-bold scale-105"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <Target className={cn("w-5 h-5 transition-transform", isCRM && "scale-110")} />
            <span className="text-[10px] mt-1 tracking-tight">CRM</span>
            {isCRM && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            )}
          </Link>
        ) : (
          <Link
            href={`/projects/${projects[0]?.id || "proj-1"}`}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative",
              isProjects
                ? "text-brand-500 font-bold scale-105"
                : "text-muted-foreground hover:text-foreground font-medium"
            )}
          >
            <FolderKanban className={cn("w-5 h-5 transition-transform", isProjects && "scale-110")} />
            <span className="text-[10px] mt-1 tracking-tight">Projects</span>
            {isProjects && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            )}
          </Link>
        )}

        {/* 3. Center Elevated Floating Action Button (FAB) */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 border-4 border-card transition-all transform hover:scale-110 active:scale-95 group"
            title="Create New Task"
          >
            <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <span className="text-[9px] font-bold text-foreground mt-0.5 tracking-tight">New</span>
        </div>

        {/* 4. Team Chat */}
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            setChatOpen(true);
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-muted-foreground hover:text-emerald-500 transition-all relative"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border-2 border-card">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">Chat</span>
        </button>

        {/* 5. Mobile Menu / Drawer */}
        <button
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative",
            isMobileMenuOpen
              ? "text-brand-500 font-bold scale-105"
              : "text-muted-foreground hover:text-foreground font-medium"
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
          {isMobileMenuOpen && (
            <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
};
