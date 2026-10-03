import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { TaskPriority, TaskStatus, CRMStage } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string) {
  if (!dateString) return "";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (e) {
    return dateString;
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getPriorityBadgeColor(priority: TaskPriority) {
  switch (priority) {
    case "urgent":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "high":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "medium":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
    case "low":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}

export function getStatusBadgeColor(status: TaskStatus) {
  const lower = (status || "").toLowerCase();
  if (lower.includes("win") || lower.includes("closed") || lower.includes("done") || lower.includes("final") || lower.includes("installation")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
  if (lower.includes("quotation") || lower.includes("2d") || lower.includes("bim") || lower.includes("review")) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
  if (lower.includes("3d") || lower.includes("cnc") || lower.includes("edge")) {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  }
  if (lower.includes("lead") || lower.includes("new") || lower.includes("measurement")) {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
  return "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20";
}

export function getCRMStageBadgeColor(stage: CRMStage) {
  switch (stage) {
    case "won":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "lost":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "negotiation":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "proposal":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "contacted":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "lead":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}

export function playNotificationSound(title?: string, message?: string) {
  if (typeof window === "undefined") return;

  // 1. Android Native Bridge notification & audio chime
  try {
    if ((window as any).AndroidBridge && typeof (window as any).AndroidBridge.playNotification === "function") {
      (window as any).AndroidBridge.playNotification(title || "Vudfit Smart", message || "New update received");
    }
  } catch (e) {}

  // 2. High-fidelity Web Audio chime
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Pitch 1: pleasant high ping chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(784, now); // G5
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Pitch 2: harmonic sparkling bell overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1568, now + 0.08); // G6
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Audio context may be restricted by browser before user interaction
  }
}
