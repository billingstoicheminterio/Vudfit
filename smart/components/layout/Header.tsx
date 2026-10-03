"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Play,
  Pause,
  Square,
  Clock,
  ChevronRight,
  Palette,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  LogIn,
  LogOut,
  KeyRound,
  Bell,
  CheckCheck,
  Trash2,
  MessageCircle,
  Camera,
  Menu,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export const Header = () => {
  const router = useRouter();
  const {
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    setCreateTaskOpen,
    setBrandSettingsOpen,
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    tickTimer,
    brandSettings,
    currentUser,
    updateUser,
    projects,
    activeProjectId,
    setLoginModalOpen,
    setUserManagementOpen,
    setChangePasswordOpen,
    logout,
    notifications,
    markNotificationsRead,
    clearNotifications,
    setActiveTask,
    setChatOpen,
    setMobileMenuOpen,
  } = useAppStore();

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateUser(currentUser.id, { avatar: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Timer Tick Interval Effect
  useEffect(() => {
    if (!activeTimer?.isRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, tickTimer]);

  // Click outside listener for user menu & notification menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border px-3 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground md:hidden shrink-0 border border-border"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img src="/vudfit-logo.png" alt="VUDFIT" className="h-6 w-auto object-contain hidden sm:inline-block" />
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline-block" />
        <span className="font-semibold text-foreground truncate text-xs sm:text-sm">
          {activeProject ? activeProject.name : "Overview Dashboard"}
        </span>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-2 sm:mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, projects, deals... (Press / to search)"
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-foreground transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-3">
        {/* Active Timer Pill */}
        {activeTimer ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-500 animate-pulse-glow">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span className="font-mono text-xs font-bold">
              {formatDuration(activeTimer.secondsElapsed)}
            </span>
            <span className="text-xs truncate max-w-[120px] font-medium hidden sm:inline">
              {activeTimer.taskTitle}
            </span>

            <div className="flex items-center gap-1 ml-1">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="p-1 hover:bg-brand-500/20 rounded transition-colors"
                  title="Pause Timer"
                >
                  <Pause className="w-3 h-3 text-brand-500" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-1 hover:bg-brand-500/20 rounded transition-colors"
                  title="Resume Timer"
                >
                  <Play className="w-3 h-3 text-brand-500" />
                </button>
              )}
              <button
                onClick={() => stopAndSaveTimer("Timer completed")}
                className="p-1 hover:bg-rose-500/20 rounded text-rose-500 transition-colors"
                title="Stop and Save Time Log"
              >
                <Square className="w-3 h-3 fill-rose-500" />
              </button>
            </div>
          </div>
        ) : null}

        {/* New Task Button */}
        <button
          onClick={() => setCreateTaskOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>

        {/* WhatsApp Chat Button */}
        <button
          onClick={() => setChatOpen(true)}
          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 text-xs font-semibold"
          title="Open Team Chat"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden lg:inline">Chat</span>
        </button>

        {/* Notification Bell Center */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) markNotificationsRead();
            }}
            className="p-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors relative"
            title="Task Assignment Notifications"
          >
            <Bell className="w-4 h-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-card animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-brand-500" />
                  <h3 className="font-bold text-xs text-foreground">Task Notifications</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={markNotificationsRead}
                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Clear notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No task notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.taskId) setActiveTask(n.taskId);
                        setIsNotifOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        n.isRead
                          ? "bg-secondary/20 border-border/40 text-muted-foreground"
                          : "bg-brand-500/10 border-brand-500/30 text-foreground font-semibold"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-foreground">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Brand & Theme Customization Button */}
        <button
          onClick={() => setBrandSettingsOpen(true)}
          className="p-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
          title="Customize Logo, Brand Name & App Color Theme"
        >
          <Palette className="w-4 h-4 text-brand-500" />
        </button>

        {/* User Profile Dropdown Menu */}
        <div className="relative pl-2 border-l border-border" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-secondary/60 transition-all border border-transparent hover:border-border"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-brand-500"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* User Dropdown Box */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
              {/* Profile Card Header with Upload Photo */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="relative group shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-brand-500"
                    />
                    <label
                      htmlFor="header-avatar-upload"
                      className="absolute inset-0 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Upload New Profile Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                    <input
                      id="header-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-foreground truncate">{currentUser.name}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                    <label
                      htmlFor="header-avatar-upload"
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-500 font-semibold cursor-pointer hover:underline"
                    >
                      <Camera className="w-3 h-3 text-brand-500" />
                      <span>Upload Profile Photo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Change Password</span>
              </button>

              {(currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager") && (
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setUserManagementOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary rounded-xl transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>User Control & Permissions</span>
                </button>
              )}

              <div className="pt-1 border-t border-border/60 mt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
