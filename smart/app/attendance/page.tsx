"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  CalendarCheck,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  TrendingUp,
  User,
  Users,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Fingerprint,
  LogIn,
  LogOut,
  Briefcase,
  Coffee,
  Play,
  Pause,
  List,
  LayoutGrid,
  Info,
  X,
  Search,
  Check,
  Edit3,
  Phone,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceStatus, AttendanceRecord } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; badge: string; dot: string; icon: any; bg: string }> = {
  present: {
    label: "Present",
    badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  half_day: {
    label: "Half Day",
    badge: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    dot: "bg-amber-500",
    bg: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20",
    icon: AlertCircle,
  },
  absent: {
    label: "Absent",
    badge: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    dot: "bg-rose-500",
    bg: "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20",
    icon: XCircle,
  },
  leave: {
    label: "On Leave",
    badge: "bg-purple-500/15 text-purple-500 border-purple-500/30",
    dot: "bg-purple-500",
    bg: "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20",
    icon: CalendarIcon,
  },
  holiday: {
    label: "Public Holiday",
    badge: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    dot: "bg-blue-500",
    bg: "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20",
    icon: Sparkles,
  },
  weekly_off: {
    label: "Weekly Off",
    badge: "bg-secondary text-muted-foreground border-border",
    dot: "bg-slate-400",
    bg: "bg-secondary/20 hover:bg-secondary/40 border-border/40",
    icon: Clock,
  },
};

export default function AttendancePage() {
  const {
    currentUser,
    users,
    attendanceRecords,
    todayPunchRecord,
    punchIn,
    punchOut,
    startBreak,
    endBreak,
    markStaffGateEntry,
  } = useAppStore();

  // Role Permissions:
  // 1. Gate Desk Register: ONLY Security Guard, Director, and Admin
  // 2. View other users' history: ONLY Director and Admin
  // 3. Regular Team Leader & Team Members: CAN ONLY VIEW THEIR OWN ATTENDANCE
  const isSecurity = currentUser.role === "security";
  const isAdminOrDirector = currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";
  const canAccessGateRegister = isSecurity || isAdminOrDirector;

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"gate_desk" | "my_attendance">(
    isSecurity ? "gate_desk" : "my_attendance"
  );

  // If user is not authorized for gate register, lock them into personal attendance
  useEffect(() => {
    if (!canAccessGateRegister && activeTab === "gate_desk") {
      setActiveTab("my_attendance");
    }
  }, [canAccessGateRegister, activeTab]);

  // Selected User for attendance view:
  // ONLY Admin and Director can view other users' attendance records.
  // Other staff are STRICTLY locked to currentUser.id.
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const effectiveUserId = isAdminOrDirector ? selectedUserId : currentUser.id;
  const targetUser = users.find((u) => u.id === effectiveUserId) || currentUser;

  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 7 = August, 8 = September (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [punchLocation, setPunchLocation] = useState<string>("Head Office (VUDFIT)");

  // Gate Desk State
  const [gateSearch, setGateSearch] = useState<string>("");
  const [gateDeptFilter, setGateDeptFilter] = useState<string>("all");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [customGateTime, setCustomGateTime] = useState<string>("");
  const [customGateRemark, setCustomGateRemark] = useState<string>("");

  // Day Details Modal State
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  // Live timer for today's punch in
  const [liveWorkSeconds, setLiveWorkSeconds] = useState<number>(0);
  const [liveBreakSeconds, setLiveBreakSeconds] = useState<number>(0);

  useEffect(() => {
    if (!todayPunchRecord.isPunchedIn || !todayPunchRecord.startTimeTimestamp) {
      setLiveWorkSeconds(0);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - todayPunchRecord.startTimeTimestamp!) / 1000);
      setLiveWorkSeconds(Math.max(0, elapsed));

      if (todayPunchRecord.isOnBreak && todayPunchRecord.breakStartTimeTimestamp) {
        const breakElapsed = Math.floor((Date.now() - todayPunchRecord.breakStartTimeTimestamp) / 1000);
        setLiveBreakSeconds(breakElapsed);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [todayPunchRecord.isPunchedIn, todayPunchRecord.isOnBreak, todayPunchRecord.startTimeTimestamp, todayPunchRecord.breakStartTimeTimestamp]);

  const formatLiveDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Filter records for the target user and selected month & year
  const monthStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}`;
  const todayDateStr = "2026-09-01";
  
  const userMonthRecords = attendanceRecords
    .filter((r) => r.userId === targetUser.id && r.date.startsWith(monthStr))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics calculation
  const totalDaysLogged = userMonthRecords.length;
  const presentDays = userMonthRecords.filter((r) => r.status === "present").length;
  const halfDays = userMonthRecords.filter((r) => r.status === "half_day").length;
  const leaves = userMonthRecords.filter((r) => r.status === "leave" || r.status === "absent").length;
  const holidays = userMonthRecords.filter((r) => r.status === "holiday" || r.status === "weekly_off").length;

  const totalMonthlyHours = userMonthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalMonthlyBreakMinutes = userMonthRecords.reduce((sum, r) => sum + (r.breakMinutes || 0), 0);
  const totalBreakHours = (totalMonthlyBreakMinutes / 60).toFixed(1);

  const effectiveWorkingDays = presentDays + halfDays * 0.5;
  const avgDailyHours = effectiveWorkingDays > 0 ? (totalMonthlyHours / effectiveWorkingDays).toFixed(1) : "0.0";
  const attendancePercentage = totalDaysLogged > 0 ? Math.round((presentDays / (totalDaysLogged - holidays || 1)) * 100) : 0;

  // Calendar Grid Generation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInCurrentMonth = getDaysInMonth(selectedYear, selectedMonth);
  const startDayOffset = getFirstDayOfWeek(selectedYear, selectedMonth);

  // Gate Desk Staff Filtering (All regular employees except Security guard itself)
  const gateStaffList = users
    .filter((u) => u.role !== "security")
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(gateSearch.toLowerCase()) ||
        u.department?.toLowerCase().includes(gateSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(gateSearch.toLowerCase());
      const matchDept = gateDeptFilter === "all" || u.department === gateDeptFilter;
      return matchSearch && matchDept;
    });

  // Get Today's Record for a user
  const getStaffTodayRecord = (userId: string) => {
    return attendanceRecords.find((r) => r.userId === userId && r.date === todayDateStr);
  };

  // Gate Stats
  const staffInOfficeCount = users.filter((u) => {
    if (u.role === "security") return false;
    const rec = getStaffTodayRecord(u.id);
    return rec && rec.punchIn && (!rec.punchOut || rec.punchOut === "-") && !rec.notes?.includes("On Lunch/Tea Break");
  }).length;

  const staffOnBreakCount = users.filter((u) => {
    if (u.role === "security") return false;
    const rec = getStaffTodayRecord(u.id);
    return rec?.notes?.includes("On Lunch/Tea Break");
  }).length;

  const staffDepartedCount = users.filter((u) => {
    if (u.role === "security") return false;
    const rec = getStaffTodayRecord(u.id);
    return rec?.punchOut && rec.punchOut !== "-";
  }).length;

  const staffNotArrivedCount = gateStaffList.length - (staffInOfficeCount + staffOnBreakCount + staffDepartedCount);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = "Date,User,Status,Punch In,Break (Mins),Punch Out,Effective Hours,Location,Notes\n";
    const rows = userMonthRecords.map((r) =>
      `"${r.date}","${targetUser.name}","${r.status}","${r.punchIn || "-"}","${r.breakMinutes ? r.breakMinutes + ' mins' : '-'}","${r.punchOut || "-"}","${r.totalHours} hrs","${r.location || "-"}","${r.notes || "-"}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_${targetUser.name.replace(/\s+/g, "_")}_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-900/40 via-brand-800/20 to-card border border-brand-500/20 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              {isSecurity ? <ShieldCheck className="w-6 h-6" /> : <CalendarCheck className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isSecurity
                ? "Main Gate Attendance & Security Desk"
                : canAccessGateRegister
                ? "Attendance & Office Hours Hub"
                : "My Attendance & Working Hours"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isSecurity ? (
              <span>Main Gate Guard Control: Log staff time-in, time-out, and lunch breaks at the entrance.</span>
            ) : canAccessGateRegister ? (
              <span>Overview of company attendance, gate in/out entries, and monthly time reports.</span>
            ) : (
              <span>Your personal monthly attendance, working hours, and lunch/tea breaks.</span>
            )}
          </p>
        </div>

        {/* Right action controls: Mode Switcher */}
        <div className="flex items-center flex-wrap gap-2.5 relative z-10">
          {/* ONLY Admin, Director, or Security Guard get the Gate Desk Tab Switcher */}
          {canAccessGateRegister && (
            <div className="flex items-center bg-secondary/80 border border-border p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setActiveTab("gate_desk")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "gate_desk"
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Gate In/Out Desk</span>
              </button>

              {!isSecurity && (
                <button
                  onClick={() => setActiveTab("my_attendance")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === "my_attendance"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Attendance History</span>
                </button>
              )}
            </div>
          )}

          {activeTab === "my_attendance" && (
            <>
              {/* Admin & Director Staff Switcher: strictly restricted to Admin & Director */}
              {isAdminOrDirector && (
                <div className="flex items-center gap-1.5 bg-card/80 border border-border px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-muted-foreground">Staff:</span>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
                  >
                    {users.map((usr) => (
                      <option key={usr.id} value={usr.id} className="bg-card text-foreground">
                        {usr.name} {usr.id === currentUser.id ? "(You)" : `(${usr.role})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Switcher Toggle: Table vs Calendar */}
              <div className="flex items-center bg-secondary/80 border border-border p-1 rounded-xl shadow-sm">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === "table"
                      ? "bg-card text-brand-500 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === "calendar"
                      ? "bg-card text-brand-500 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>

              {/* Month selector */}
              <div className="flex items-center gap-1 bg-card/80 border border-border px-2 py-1 rounded-xl">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-foreground px-1">
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </span>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export CSV button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-colors shadow-sm"
                title="Download Monthly Attendance CSV"
              >
                <Download className="w-3.5 h-3.5 text-brand-500" />
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: GATE SECURITY ATTENDANCE REGISTER DESK                         */}
      {/* Strictly restricted to: Security Guard, Director, and Admin               */}
      {/* ========================================================================= */}
      {activeTab === "gate_desk" && canAccessGateRegister ? (
        <div className="space-y-6">
          {/* Gate Live KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-emerald-500/25 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">In Office Now</span>
                <div className="text-xl font-black text-emerald-500">{staffInOfficeCount} <span className="text-xs font-semibold text-foreground">Staff</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-amber-500/25 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">On Lunch/Break</span>
                <div className="text-xl font-black text-amber-500">{staffOnBreakCount} <span className="text-xs font-semibold text-foreground">Staff</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-rose-500/25 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Departed (Gate Out)</span>
                <div className="text-xl font-black text-rose-500">{staffDepartedCount} <span className="text-xs font-semibold text-foreground">Staff</span></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Staff</span>
                <div className="text-xl font-black text-foreground">{gateStaffList.length} <span className="text-xs font-semibold text-muted-foreground">Members</span></div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={gateSearch}
                onChange={(e) => setGateSearch(e.target.value)}
                placeholder="Search staff by name, department, or phone number..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground">Gate Location:</span>
              <span className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-foreground border border-border flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                Main Security Gate (VUDFIT HQ)
              </span>
            </div>
          </div>

          {/* Gate Staff Table */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-brand-500" />
                  <span>Today&apos;s Staff Gate In & Out Register</span>
                  <span className="text-xs font-semibold text-muted-foreground">({todayDateStr})</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Security Guard & Management Desk: Mark arrival entry (Time In), lunch break departures, and evening exits (Time Out).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider bg-secondary/30">
                    <th className="py-3 px-4 rounded-l-xl font-bold">Staff Member</th>
                    <th className="py-3 px-4 font-bold">Department</th>
                    <th className="py-3 px-4 font-bold">Current Status</th>
                    <th className="py-3 px-4 font-bold">Time In (Arrival)</th>
                    <th className="py-3 px-4 font-bold">Break Duration</th>
                    <th className="py-3 px-4 font-bold">Time Out (Exit)</th>
                    <th className="py-3 px-4 font-bold text-center">Gate Action Controls</th>
                    <th className="py-3 px-4 rounded-r-xl font-bold text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {gateStaffList.map((staff) => {
                    const todayRec = getStaffTodayRecord(staff.id);
                    const isInside = todayRec && todayRec.punchIn && (!todayRec.punchOut || todayRec.punchOut === "-") && !todayRec.notes?.includes("On Lunch/Tea Break");
                    const isOnBreak = todayRec?.notes?.includes("On Lunch/Tea Break");
                    const isDeparted = todayRec?.punchOut && todayRec.punchOut !== "-";

                    return (
                      <tr key={staff.id} className="hover:bg-secondary/30 transition-colors">
                        {/* Staff Member */}
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-8 h-8 rounded-full object-cover border border-border shrink-0 shadow-sm"
                            />
                            <div>
                              <span className="font-bold text-foreground block">{staff.name}</span>
                              <span className="text-[10px] text-muted-foreground capitalize">{staff.role.replace("_", " ")}</span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-muted-foreground">
                          <span className="font-medium">{staff.department || "Head Office"}</span>
                        </td>

                        {/* Current Status */}
                        <td className="py-3.5 px-4">
                          {isOnBreak ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              <Coffee className="w-3 h-3" /> On Break
                            </span>
                          ) : isInside ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Office
                            </span>
                          ) : isDeparted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                              <LogOut className="w-3 h-3" /> Departed ({todayRec?.totalHours} hrs)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                              Not Arrived
                            </span>
                          )}
                        </td>

                        {/* Time In */}
                        <td className="py-3.5 px-4">
                          <span className={cn("font-mono font-bold", todayRec?.punchIn ? "text-emerald-500" : "text-muted-foreground")}>
                            {todayRec?.punchIn || "-"}
                          </span>
                        </td>

                        {/* Break Time */}
                        <td className="py-3.5 px-4">
                          {todayRec?.breakMinutes ? (
                            <span className="font-bold text-amber-500 font-mono flex items-center gap-1">
                              <Coffee className="w-3 h-3" /> {todayRec.breakMinutes}m
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>

                        {/* Time Out */}
                        <td className="py-3.5 px-4">
                          <span className={cn("font-mono font-bold", todayRec?.punchOut ? "text-foreground" : "text-muted-foreground")}>
                            {todayRec?.punchOut || "-"}
                          </span>
                        </td>

                        {/* 1-Click Gate Action Controls */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Gate In Button */}
                            {!todayRec?.punchIn && (
                              <button
                                onClick={() => markStaffGateEntry({ userId: staff.id, type: "in" })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all hover:scale-105 active:scale-95"
                                title="Mark Arrival at Main Gate"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Gate In</span>
                              </button>
                            )}

                            {/* Break Button */}
                            {todayRec?.punchIn && !isDeparted && (
                              isOnBreak ? (
                                <button
                                  onClick={() => markStaffGateEntry({ userId: staff.id, type: "break_end" })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm"
                                  title="Staff Returned from Lunch/Tea"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Break In</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => markStaffGateEntry({ userId: staff.id, type: "break_start" })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-sm"
                                  title="Staff Going Out for Lunch/Tea"
                                >
                                  <Coffee className="w-3 h-3" />
                                  <span>Break Out</span>
                                </button>
                              )
                            )}

                            {/* Gate Out Button */}
                            {todayRec?.punchIn && !isDeparted && (
                              <button
                                onClick={() => markStaffGateEntry({ userId: staff.id, type: "out" })}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition-all hover:scale-105 active:scale-95"
                                title="Mark Evening Exit at Main Gate"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Gate Out</span>
                              </button>
                            )}

                            {/* Custom Time Edit Button */}
                            <button
                              onClick={() => {
                                setEditingStaffId(staff.id);
                                setCustomGateTime(todayRec?.punchIn || "09:30 AM");
                                setCustomGateRemark(todayRec?.notes || "");
                              }}
                              className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border"
                              title="Manually Adjust Punch Time or Add Security Note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="py-3.5 px-4 text-right text-muted-foreground text-[11px]">
                          <span className="truncate max-w-[120px] block ml-auto">{todayRec?.notes || "Normal Shift"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SECTION B: PERSONAL ATTENDANCE & MONTHLY LOGS                             */
        /* (Visible to all users, but regular employees only see their OWN data)    */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Live Punch In / Break / Punch Out Card */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl transition-all",
                  todayPunchRecord.isOnBreak
                    ? "bg-amber-500 shadow-amber-500/30 animate-pulse"
                    : todayPunchRecord.isPunchedIn
                    ? "bg-emerald-600 shadow-emerald-600/30 animate-pulse"
                    : "bg-slate-600 shadow-slate-600/20"
                )}
              >
                {todayPunchRecord.isOnBreak ? (
                  <Coffee className="w-8 h-8" />
                ) : (
                  <Fingerprint className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Today&apos;s Live Attendance & Break Status
                  </h3>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      todayPunchRecord.isOnBreak
                        ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                        : todayPunchRecord.isPunchedIn
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                    )}
                  >
                    {todayPunchRecord.isOnBreak
                      ? "☕ On Break (Lunch/Tea)"
                      : todayPunchRecord.isPunchedIn
                      ? "🟢 Checked In (Working)"
                      : "⚪ Checked Out / Not Punched"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>Arrival: <strong className="text-foreground">{todayPunchRecord.punchInTime || "Not yet"}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3 h-3 text-amber-500" />
                    <span>Break Taken: <strong className="text-foreground">{Math.round((todayPunchRecord.totalBreakSeconds || 0) / 60)} mins</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-500" />
                    {todayPunchRecord.location || "Head Office (VUDFIT)"}
                  </span>
                </p>
              </div>
            </div>

            {/* Live Counters & Action Controls */}
            <div className="flex items-center flex-wrap gap-3">
              {todayPunchRecord.isPunchedIn && (
                <div className="flex items-center gap-2">
                  {/* Working Live Timer */}
                  <div className="flex flex-col items-end px-3 py-1 bg-secondary/50 border border-border rounded-xl">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Logged Work</span>
                    <span className="font-mono text-sm font-black text-emerald-500">
                      {liveWorkSeconds > 0 ? formatLiveDuration(liveWorkSeconds) : "08:15:00"}
                    </span>
                  </div>

                  {/* Break Live Timer */}
                  {todayPunchRecord.isOnBreak && (
                    <div className="flex flex-col items-end px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-pulse">
                      <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Break Timer</span>
                      <span className="font-mono text-sm font-black text-amber-500">
                        {formatLiveDuration(liveBreakSeconds)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Break & Punch Out */}
              {todayPunchRecord.isPunchedIn ? (
                <div className="flex items-center gap-2">
                  {/* Take Break / Resume Work */}
                  {todayPunchRecord.isOnBreak ? (
                    <button
                      onClick={endBreak}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Resume Work</span>
                    </button>
                  ) : (
                    <button
                      onClick={startBreak}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
                      title="Pause for Lunch, Tea or Coffee Break"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Take Break (Lunch/Tea)</span>
                    </button>
                  )}

                  {/* Punch Out */}
                  <button
                    onClick={punchOut}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Punch Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={punchLocation}
                    onChange={(e) => setPunchLocation(e.target.value)}
                    className="bg-secondary text-foreground text-xs font-semibold px-2.5 py-2 rounded-xl border border-border focus:outline-none"
                  >
                    <option value="Head Office (VUDFIT)">🏢 Head Office</option>
                    <option value="Factory / Production">🏭 Factory / Production</option>
                    <option value="Client Site Visit">📐 Client Site Visit</option>
                    <option value="Remote / Work From Home">💻 Remote Work</option>
                  </select>
                  <button
                    onClick={() => punchIn(punchLocation)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Punch In (Mark Present)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Summary Statistics Cards (KPIs) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-card border border-emerald-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Days Present</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {presentDays} <span className="text-xs text-emerald-500 font-bold">Days</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{attendancePercentage}% Office Attendance</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-brand-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Hours Worked</span>
                <Clock className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {totalMonthlyHours.toFixed(1)} <span className="text-xs text-brand-400 font-bold">Hrs</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Avg {avgDailyHours} hrs/day</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-amber-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Breaks</span>
                <Coffee className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {totalBreakHours} <span className="text-xs text-amber-500 font-bold">Hrs</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{totalMonthlyBreakMinutes} mins lunch & tea</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-amber-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Half Days</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {halfDays} <span className="text-xs text-amber-500 font-bold">Days</span>
              </div>
              <div className="text-[10px] text-muted-foreground">4.5 hrs average shifts</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-rose-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Leaves / Absents</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {leaves} <span className="text-xs text-rose-500 font-bold">Days</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Approved paid/unpaid leaves</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-blue-500/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Sundays & Offs</span>
                <CalendarIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {holidays} <span className="text-xs text-blue-500 font-bold">Days</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Weekly offs & Public holidays</div>
            </div>
          </div>

          {/* Table Log vs Calendar Grid */}
          {viewMode === "table" ? (
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>Monthly Attendance Log Book</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ({MONTH_NAMES[selectedMonth]} {selectedYear})
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {targetUser.id === currentUser.id
                      ? "Your personal record of punch in, punch out, lunch/tea break duration, and working hours."
                      : `Attendance log book for ${targetUser.name} (${targetUser.role}).`}
                  </p>
                </div>
              </div>

              {userMonthRecords.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-semibold">No attendance records found for {MONTH_NAMES[selectedMonth]} {selectedYear}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider bg-secondary/30">
                        <th className="py-3 px-4 rounded-l-xl font-bold">Date & Day</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold">Punch In (Arrival)</th>
                        <th className="py-3 px-4 font-bold">Break Duration (Lunch/Tea)</th>
                        <th className="py-3 px-4 font-bold">Punch Out (Departure)</th>
                        <th className="py-3 px-4 font-bold">Effective Working Hours</th>
                        <th className="py-3 px-4 font-bold">Work Location</th>
                        <th className="py-3 px-4 rounded-r-xl font-bold">Notes / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {userMonthRecords.map((rec) => {
                        const statusInfo = STATUS_CONFIG[rec.status] || STATUS_CONFIG.present;
                        const StatusIcon = statusInfo.icon;
                        const dateObj = new Date(rec.date);
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                        const isOvertime = rec.totalHours > 9.0;

                        return (
                          <tr
                            key={rec.id}
                            onClick={() => setSelectedDayRecord(rec)}
                            className="hover:bg-secondary/40 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex flex-col items-center justify-center font-bold text-[10px]">
                                  <span className="text-muted-foreground leading-none">{dayName}</span>
                                  <span className="text-foreground leading-none font-black mt-0.5">{rec.date.split("-")[2]}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-foreground block">{rec.date}</span>
                                  <span className="text-[10px] text-muted-foreground capitalize">{dateObj.toLocaleDateString("en-US", { weekday: "long" })}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border", statusInfo.badge)}>
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusInfo.label}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-semibold">
                              <span className={rec.punchIn !== "-" ? "text-emerald-500 font-bold" : "text-muted-foreground"}>{rec.punchIn || "-"}</span>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              {rec.breakMinutes ? (
                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                  <Coffee className="w-3.5 h-3.5" /> {rec.breakMinutes} mins
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-semibold">
                              <span className={rec.punchOut && rec.punchOut !== "-" ? "text-foreground" : "text-muted-foreground"}>{rec.punchOut || "-"}</span>
                            </td>

                            <td className="py-3.5 px-4">
                              {rec.totalHours > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-foreground">{rec.totalHours} hrs</span>
                                  {isOvertime && <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400 text-[9px] font-bold">+OT</span>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate max-w-[140px]">{rec.location || "Head Office"}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-muted-foreground text-[11px]">{rec.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Monthly Calendar Grid View */
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30 rounded-xl">
                    {day}
                  </div>
                ))}

                {Array.from({ length: startDayOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-secondary/10 border border-dashed border-border/40 opacity-40" />
                ))}

                {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                  const dayNumber = idx + 1;
                  const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`;
                  const record = userMonthRecords.find((r) => r.date === dateStr);
                  const status = record?.status || (new Date(dateStr).getDay() === 0 ? "weekly_off" : undefined);
                  const statusInfo = status ? STATUS_CONFIG[status] : null;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => record && setSelectedDayRecord(record)}
                      className={cn(
                        "h-28 p-2.5 rounded-2xl border transition-all flex flex-col justify-between group",
                        record ? `${statusInfo?.bg} cursor-pointer hover:shadow-md hover:scale-[1.02]` : "bg-card border-border/60 hover:bg-secondary/30",
                        dateStr === "2026-09-01" && "ring-2 ring-brand-500 shadow-brand-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black", dateStr === "2026-09-01" ? "bg-brand-500 text-white" : "text-foreground group-hover:text-brand-500")}>
                          {dayNumber}
                        </span>
                        {statusInfo && <span className={cn("w-2 h-2 rounded-full", statusInfo.dot)} />}
                      </div>

                      {record ? (
                        <div className="space-y-1 text-left">
                          {record.status === "present" || record.status === "half_day" ? (
                            <>
                              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-foreground">
                                <Clock className="w-3 h-3 text-brand-500 shrink-0" />
                                <span>{record.totalHours} hrs</span>
                              </div>
                              {record.breakMinutes ? (
                                <div className="flex items-center gap-1 text-[9px] text-amber-500 font-semibold">
                                  <Coffee className="w-2.5 h-2.5 shrink-0" />
                                  <span>{record.breakMinutes}m break</span>
                                </div>
                              ) : null}
                              <div className="text-[9px] text-muted-foreground truncate">{record.punchIn} - {record.punchOut || "Active"}</div>
                            </>
                          ) : (
                            <span className={cn("inline-block text-[9px] font-bold px-1.5 py-0.5 rounded", statusInfo?.badge)}>
                              {statusInfo?.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 self-center">No log</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Time & Gate Note Edit Modal */}
      {editingStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Security Gate Custom Entry</h3>
                  <span className="text-xs text-muted-foreground">
                    {users.find((u) => u.id === editingStaffId)?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingStaffId(null)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Custom Punch Time</label>
                <input
                  type="text"
                  value={customGateTime}
                  onChange={(e) => setCustomGateTime(e.target.value)}
                  placeholder="e.g. 09:32 AM or 06:45 PM"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Security Gate Remark / Pass Note</label>
                <input
                  type="text"
                  value={customGateRemark}
                  onChange={(e) => setCustomGateRemark(e.target.value)}
                  placeholder="e.g. Client Site Visit, Late permission approved"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  markStaffGateEntry({
                    userId: editingStaffId,
                    type: "in",
                    customTime: customGateTime,
                    notes: customGateRemark,
                  });
                  setEditingStaffId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Save Gate In
              </button>

              <button
                onClick={() => {
                  markStaffGateEntry({
                    userId: editingStaffId,
                    type: "out",
                    customTime: customGateTime,
                    notes: customGateRemark,
                  });
                  setEditingStaffId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Save Gate Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Attendance Details</h3>
                  <span className="text-xs text-muted-foreground">{selectedDayRecord.date}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Status</span>
                <div className="font-bold text-foreground capitalize flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[selectedDayRecord.status]?.dot)} />
                  {STATUS_CONFIG[selectedDayRecord.status]?.label}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Working Hours</span>
                <div className="font-mono font-black text-foreground">{selectedDayRecord.totalHours} Hours</div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Punch In</span>
                <div className="font-mono font-bold text-emerald-500">{selectedDayRecord.punchIn || "-"}</div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Punch Out</span>
                <div className="font-mono font-bold text-foreground">{selectedDayRecord.punchOut || "-"}</div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1 col-span-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Break Duration</span>
                <div className="font-bold text-amber-500 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" />
                  <span>{selectedDayRecord.breakMinutes || 0} Minutes (Lunch & Tea)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1 col-span-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Work Location</span>
                <div className="font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>{selectedDayRecord.location || "Head Office"}</span>
                </div>
              </div>

              {selectedDayRecord.notes && (
                <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-1 col-span-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Remarks / Notes</span>
                  <div className="text-muted-foreground">{selectedDayRecord.notes}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDayRecord(null)}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
