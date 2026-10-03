"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  CheckCircle2,
  Clock,
  Target,
  FolderKanban,
  AlertTriangle,
  Play,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  Calendar,
  ArrowRight,
  MessageCircle,
  Plus,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getPriorityBadgeColor,
  getStatusBadgeColor,
} from "@/lib/utils";

export default function OverviewDashboard() {

  const {
    tasks,
    projects,
    deals,
    timeEntries,
    currentUser,
    users,
    taskFilterUser,
    setTaskFilterUser,
    startTimer,
    updateTaskStatus,
    setCreateTaskOpen,
    setActiveTask,
    addNotification,
    setChatOpen,
    chatMessages,
  } = useAppStore();

  // Permissions & Role Access
  const canAccessCRM =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.department?.toLowerCase().includes("sales") ||
    currentUser.role === "team_leader" ||
    (currentUser.permissions?.departmentAccess === "all");
  const canViewAll =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.role === "team_leader" ||
    (currentUser.permissions?.canViewAllTasks ?? false);

  const canCompleteTask =
    currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";

  const filteredUserObj = useMemo(
    () => users.find((u) => u.id === taskFilterUser),
    [users, taskFilterUser]
  );

  // User Scope Check (personal vs company-wide)
  const isUserScope = !canAccessCRM || taskFilterUser === "my_tasks";

  // Task list filtering for display table
  const displayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!canViewAll || taskFilterUser === "my_tasks") {
        return t.assignedTo.includes(currentUser.id) || t.createdBy === currentUser.id;
      }
      if (taskFilterUser !== "all") {
        return t.assignedTo.includes(taskFilterUser) || t.createdBy === taskFilterUser;
      }
      return true;
    });
  }, [tasks, canViewAll, taskFilterUser, currentUser.id]);

  // Calculate personalized metrics based on active user scope
  const activeMetricsTasks = useMemo(() => {
    return isUserScope
      ? tasks.filter((t) => t.assignedTo.includes(currentUser.id) || t.createdBy === currentUser.id)
      : tasks;
  }, [isUserScope, tasks, currentUser.id]);

  const { completedTasks, inProgressTasks, pendingTasksCount, overdueTasks, workCompletionRatio } = useMemo(() => {
    const completed = activeMetricsTasks.filter((t) => t.status === "done").length;
    const inProgress = activeMetricsTasks.filter((t) => t.status === "in_progress").length;
    const pending = activeMetricsTasks.filter((t) => t.status !== "done").length;
    const now = new Date();
    const overdue = activeMetricsTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
    );
    const ratio = Math.round((completed / (activeMetricsTasks.length || 1)) * 100);

    return {
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasksCount: pending,
      overdueTasks: overdue,
      workCompletionRatio: ratio,
    };
  }, [activeMetricsTasks]);

  // Time Logged Metric (User vs Company)
  const { totalLoggedHours, totalLoggedSeconds, scopedTimeEntries } = useMemo(() => {
    const scoped = isUserScope
      ? timeEntries.filter((e) => e.userId === currentUser.id)
      : timeEntries;
    const sec = scoped.reduce((sum, e) => sum + e.durationSeconds, 0);
    return {
      scopedTimeEntries: scoped,
      totalLoggedSeconds: sec,
      totalLoggedHours: (sec / 3600).toFixed(1),
    };
  }, [isUserScope, timeEntries, currentUser.id]);

  // Projects Metric (User assigned vs Company)
  const scopedProjects = useMemo(() => {
    return isUserScope
      ? projects.filter((p) => activeMetricsTasks.some((t) => t.projectId === p.id))
      : projects;
  }, [isUserScope, projects, activeMetricsTasks]);

  const totalPipelineValue = useMemo(
    () => deals.reduce((sum, d) => sum + d.value, 0),
    [deals]
  );
  const myAssignedCount = activeMetricsTasks.length;

  const unreadChatCount = useMemo(() => {
    const userEmail = currentUser?.email?.toLowerCase();
    return chatMessages.filter(
      (m) =>
        !m.isRead &&
        (m.receiverId === currentUser?.id ||
          (userEmail && m.receiverEmail?.toLowerCase() === userEmail))
    ).length;
  }, [chatMessages, currentUser?.id, currentUser?.email]);

  const circumference = 2 * Math.PI * 34;
  const strokeDashoffset = circumference - (workCompletionRatio / 100) * circumference;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* ========================================================
          MOBILE EXCLUSIVE NATIVE UI (Inspired by Reference Design)
         ======================================================== */}
      <div className="md:hidden space-y-4">
        {/* 1. Mobile Header & User Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-brand-500/40 shadow-sm"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card absolute bottom-0 right-0" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground flex items-center gap-1.5 leading-tight">
                <span>Hi, {currentUser.name.split(" ")[0]}</span>
                <span>👋</span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                {currentUser.department || "Vudfit Team"} • <span className="capitalize font-semibold text-brand-400">{currentUser.role.replace("_", " ")}</span>
              </p>
            </div>
          </div>

          {/* Quick Chat Shortcut Icon with Unread Bubble */}
          <button
            onClick={() => setChatOpen(true)}
            className="p-2.5 rounded-2xl bg-card border border-border shadow-sm hover:border-emerald-500/50 text-foreground relative transition-all active:scale-95"
            title="Open Team Chat"
          >
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce shadow-sm">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>

        {/* 2. "Today's Progress" Card (Circular Ring & Stats) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-card via-card/95 to-secondary/30 border border-border/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Progress
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-extrabold">
              {activeMetricsTasks.length} Active Items
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Progress Ring */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-secondary"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-foreground leading-none">
                  {workCompletionRatio}%
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground mt-0.5">
                  Done
                </span>
              </div>
            </div>

            {/* Metrics Breakdown List */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Completed
                </span>
                <span className="font-bold text-foreground">{completedTasks} tasks</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  In Progress
                </span>
                <span className="font-bold text-foreground">{inProgressTasks} active</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Overdue
                </span>
                <span className="font-bold text-rose-400">{overdueTasks.length} items</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Logged Hours
                </span>
                <span className="font-bold text-foreground">{totalLoggedHours}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Actions Grid */}
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
            Quick Actions
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-sm active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-foreground mt-1.5 tracking-tight">New Task</span>
            </button>

            <button
              onClick={() => setChatOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-sm active:scale-95 transition-all text-center group relative"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                <MessageCircle className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-emerald-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-foreground mt-1.5 tracking-tight">Team Chat</span>
            </button>

            <Link
              href="/attendance"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-sm active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-foreground mt-1.5 tracking-tight">Attendance</span>
            </Link>

            {canAccessCRM ? (
              <Link
                href="/crm"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-sm active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-foreground mt-1.5 tracking-tight">CRM Deals</span>
              </Link>
            ) : (
              <button
                onClick={() => setTaskFilterUser(taskFilterUser === "my_tasks" ? "all" : "my_tasks")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-sm active:scale-95 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-foreground mt-1.5 tracking-tight">My Tasks</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          DESKTOP WELCOME BANNER & KPI CARDS (hidden on mobile)
         ======================================================== */}
      {/* Welcome Banner */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-900/40 via-indigo-900/20 to-card border border-brand-500/20 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Welcome back, {currentUser.name}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            You have <span className="text-brand-400 font-semibold">{myAssignedCount} active item{myAssignedCount === 1 ? "" : "s"}</span> ({completedTasks} completed, <span className="text-emerald-400 font-semibold">{workCompletionRatio}% Work Ratio</span>) and{" "}
            <span className="text-rose-400 font-semibold">{overdueTasks.length} overdue item{overdueTasks.length === 1 ? "" : "s"}</span> requiring attention.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2"
          >
            <span>Create New Task</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid (Desktop & Tablet) */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tasks (User Scoped) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md hover:border-brand-500/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {isUserScope ? "My Active Tasks" : "Total Active Tasks"}
            </span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{activeMetricsTasks.length}</span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {completedTasks} Done ({workCompletionRatio}%)
            </span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${workCompletionRatio}%` }}
            />
          </div>
        </div>

        {/* Card 2: CRM Sales Pipeline (Admin & Director) or Pending Tasks (Other Users) */}
        {canAccessCRM ? (
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md hover:border-brand-500/40 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                CRM Pipeline Value
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {formatCurrency(totalPipelineValue)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground block">
              Across {deals.length} qualified enterprise sales deals
            </span>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md hover:border-brand-500/40 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                {isUserScope ? "My Pending Tasks" : "Pending Tasks"}
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">{pendingTasksCount}</span>
              <span className="text-xs text-amber-500 font-semibold">{workCompletionRatio}% Ratio</span>
            </div>
            <span className="text-xs text-muted-foreground block">
              {inProgressTasks} in progress, {overdueTasks.length} overdue
            </span>
          </div>
        )}

        {/* Card 3: Logged Hours (User Scoped) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md hover:border-brand-500/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {isUserScope ? "My Time Logged" : "Time Logged"}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{totalLoggedHours}h</span>
            <span className="text-xs text-muted-foreground">logged</span>
          </div>
          <span className="text-xs text-muted-foreground block">
            {scopedTimeEntries.length} recorded work session{scopedTimeEntries.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Card 4: Active Projects (User Scoped) */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md hover:border-brand-500/40 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {isUserScope ? "My Active Projects" : "Active Projects"}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{scopedProjects.length}</span>
            <span className="text-xs text-amber-500 font-semibold">In Progress</span>
          </div>
          <span className="text-xs text-muted-foreground block">
            Across {scopedProjects.reduce((acc, p) => acc + p.sections.length, 0)} workflow section{scopedProjects.reduce((acc, p) => acc + p.sections.length, 0) === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Main Grid: My Tasks & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Assigned Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-brand-500" />
                    <h2 className="text-lg font-bold text-foreground">
                      {taskFilterUser === "my_tasks"
                        ? "My Tasks"
                        : taskFilterUser === "all"
                        ? "All Team Tasks"
                        : filteredUserObj
                        ? `${filteredUserObj.name}'s Tasks`
                        : "Filtered Tasks"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold">
                      {displayTasks.length}
                    </span>
                  </div>

                  {/* Task View Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setTaskFilterUser("my_tasks")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        taskFilterUser === "my_tasks"
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-500"
                          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      My Tasks
                    </button>

                    <button
                      onClick={() => setTaskFilterUser("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        taskFilterUser === "all"
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-500"
                          : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All Tasks
                    </button>

                    {filteredUserObj && taskFilterUser !== "my_tasks" && taskFilterUser !== "all" && (
                      <button
                        onClick={() => setTaskFilterUser("all")}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500 text-white shadow-sm border border-brand-600 transition-all hover:bg-brand-600"
                        title="Click to clear filter"
                      >
                        <img
                          src={filteredUserObj.avatar}
                          alt={filteredUserObj.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                        <span>{filteredUserObj.name}</span>
                        <span className="ml-1 opacity-75 hover:opacity-100 font-bold">✕</span>
                      </button>
                    )}
                  </div>
                </div>

            {/* Native Mobile Task Cards Feed (Mobile Only) */}
            <div className="md:hidden divide-y divide-border/60">
              {displayTasks.map((t) => {
                const isDone = t.status === "done";
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !isDone;
                const project = projects.find((p) => p.id === t.projectId);

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTask(t.id)}
                    className="p-3.5 hover:bg-secondary/40 active:bg-secondary/60 transition-all cursor-pointer space-y-2.5"
                  >
                    {/* Card Top Row: Project & Priority & Due Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {project && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground truncate border border-border/60">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                            <span className="truncate">{project.name}</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeColor(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 shrink-0 ${
                          isOverdue ? "text-rose-500 font-bold" : "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.dueDate) || "No Due Date"}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h4
                      className={`text-sm font-bold leading-snug ${
                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {t.title}
                    </h4>

                    {/* Card Bottom Row: Assignee & Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">Assigned:</span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {t.assignedTo.map((uid) => {
                            const u = users.find((usr) => usr.id === uid);
                            if (!u) return null;
                            return (
                              <img
                                key={uid}
                                src={u.avatar}
                                alt={u.name}
                                className="inline-block h-5 w-5 rounded-full ring-2 ring-card object-cover"
                                title={u.name}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Complete Checkbox (Admin/Director/Manager) or Transfer Button (Team Members) */}
                      {canCompleteTask ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(t.id, isDone ? "todo" : "done");
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isDone
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                              : "bg-secondary border border-border text-foreground hover:border-brand-500"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDone ? "Done" : "Mark Done"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTask(t.id);
                            addNotification({
                              title: "Transfer Task 🔄",
                              message: "Team members cannot complete tasks. Click 'Transfer Department' in the task panel to hand off to another person.",
                              type: "general",
                            });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-600 hover:bg-brand-500 hover:text-white transition-all text-xs font-bold"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Transfer 🔄</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tasks List Table (Desktop Only) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground font-semibold uppercase">
                    <th className="py-2.5 px-3">{canCompleteTask ? "Status" : "Transfer / Status"}</th>
                    <th className="py-2.5 px-3">Task Name</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {displayTasks.map((t) => {
                    const isDone = t.status === "done";
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !isDone;
                    const project = projects.find((p) => p.id === t.projectId);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                        onClick={() => setActiveTask(t.id)}
                      >
                        {/* Status Toggle / Transfer Action */}
                        <td className="py-3 px-3">
                          {canCompleteTask ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTaskStatus(t.id, isDone ? "todo" : "done");
                              }}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-muted-foreground/40 hover:border-brand-500"
                              }`}
                              title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                            >
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTask(t.id);
                                addNotification({
                                  title: "Transfer Task 🔄",
                                  message: "Team members cannot complete tasks. Click 'Transfer Department' in the task panel to hand off to another person.",
                                  type: "general",
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-600 hover:bg-brand-500 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1 shrink-0"
                              title="Team members cannot complete tasks. Click to transfer/handoff to another team member or department."
                            >
                              <ArrowRight className="w-3 h-3" />
                              <span>Transfer</span>
                            </button>
                          )}
                        </td>

                        {/* Title & Project Tag */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${
                                isDone ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {t.title}
                            </span>
                            {project && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Priority Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold capitalize ${getPriorityBadgeColor(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-3 px-3 text-xs">
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(t.dueDate) || "No Due Date"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-right text-xs font-medium">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTask(t.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white font-semibold transition-all inline-flex items-center gap-1"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Overdue Alerts */}
        <div className="space-y-6">
          {/* Overdue Alerts Card */}
          {overdueTasks.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Overdue Action Items ({overdueTasks.length})</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.map((ot) => (
                  <div
                    key={ot.id}
                    onClick={() => setActiveTask(ot.id)}
                    className="p-2.5 rounded-xl bg-card/60 border border-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground truncate">{ot.title}</span>
                    <span className="text-[10px] text-rose-400 font-bold shrink-0 ml-2">
                      {formatDate(ot.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Projects Status */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Projects Overview</h2>
              <span className="text-xs text-muted-foreground font-semibold">
                {projects.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const projTasks = tasks.filter((t) => t.projectId === proj.id);
                const projDone = projTasks.filter((t) => t.status === "done").length;
                const progressPct = Math.round((projDone / (projTasks.length || 1)) * 100);

                return (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    className="p-3.5 rounded-xl border border-border/60 hover:border-brand-500/40 bg-secondary/20 hover:bg-secondary/50 transition-all block space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="font-semibold text-sm text-foreground truncate">
                          {proj.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-brand-400">{progressPct}%</span>
                    </div>

                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%`, backgroundColor: proj.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{projTasks.length} total tasks</span>
                      <span>Target: {formatDate(proj.endDate) || "Ongoing"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
