"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

export default function TimeTrackingPage() {
  const {
    timeEntries,
    tasks,
    projects,
    currentUser,
    users,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
  } = useAppStore();

  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || "");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState<number>(2);
  const [minutes, setMinutes] = useState<number>(30);
  const [isBillable, setIsBillable] = useState(true);

  // Manual Log Submission
  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;

    const totalSecs = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
    if (totalSecs <= 0) return;

    const proj = projects.find((p) => p.id === task.projectId);

    useAppStore.setState((state) => ({
      timeEntries: [
        {
          id: `time-${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          projectName: proj?.name || "Project",
          userId: currentUser.id,
          user: currentUser,
          description: description || "Manual log entry",
          durationSeconds: totalSecs,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          isBillable,
          createdAt: new Date().toISOString(),
        },
        ...state.timeEntries,
      ],
    }));

    setDescription("");
  };

  const totalLoggedSecs = timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xl shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                Time Tracking & Workload Analytics
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log task hours, monitor billable timesheets, and view real-time team workload distribution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-secondary border border-border text-xs font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Total Hours: {formatDuration(totalLoggedSecs)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Timer Widget & Manual Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Timer Box */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> Active Stopwatch Timer
          </h2>

          {activeTimer ? (
            <div className="p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-center space-y-3">
              <span className="text-4xl font-extrabold font-mono text-brand-500 tracking-wider block">
                {formatDuration(activeTimer.secondsElapsed)}
              </span>
              <p className="text-xs font-semibold text-foreground truncate">
                {activeTimer.taskTitle}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="p-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="p-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={() => stopAndSaveTimer("Completed task session")}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Square className="w-4 h-4" /> Save Log
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-border/80 rounded-2xl space-y-3">
              <p className="text-xs text-muted-foreground">No active timer running.</p>
              <button
                onClick={() => {
                  if (tasks[0]) {
                    startTimer(tasks[0].id, tasks[0].title, "SmartTask");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Start Timer on Task
              </button>
            </div>
          )}
        </div>

        {/* Manual Time Logger Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-500" /> Manual Time Entry
          </h2>

          <form onSubmit={handleManualLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Select Task
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Work Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Code refactoring & test suite run"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-xs focus:outline-none text-foreground"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Log Time
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Timesheets Log Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
        <h2 className="text-base font-bold text-foreground">Timesheet Logs</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs text-muted-foreground font-semibold uppercase">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Task / Project</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Billable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.name}
                        className="w-6 h-6 rounded-full object-cover border border-border"
                      />
                      <span className="text-xs font-medium text-foreground">{entry.user.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">{entry.taskTitle}</span>
                      <span className="text-[11px] text-muted-foreground">{entry.projectName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {entry.description || "Work log"}
                  </td>

                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-brand-400">
                    {formatDuration(entry.durationSeconds)}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
                      Billable
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
