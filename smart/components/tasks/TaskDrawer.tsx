"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { HandoffModal } from "./HandoffModal";
import { TaskAttachments } from "./TaskAttachments";
import {
  X,
  Calendar,
  User,
  MessageSquare,
  Trash2,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
  UserCheck,
  History,
  Clock,
  Send,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  formatDate,
  formatTimeAgo,
  getPriorityBadgeColor,
  getStatusBadgeColor,
} from "@/lib/utils";
import { TaskPriority, LeadSource } from "@/lib/types";

export const TaskDrawer = () => {
  const {
    tasks,
    activeTaskId,
    setActiveTask,
    updateTask,
    updateTaskStatus,
    updateTaskPriority,
    deleteTask,
    addComment,
    deleteComment,
    projects,
    users,
    currentUser,
  } = useAppStore();

  const [newCommentText, setNewCommentText] = useState("");
  const [isHandoffOpen, setHandoffOpen] = useState(false);

  const task = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null;
  const project = task ? projects.find((p) => p.id === task.projectId) : null;

  // Admin account is strictly for management; tasks can only be assigned to operational team members
  const assignableUsers = users.filter(
    (u) => u.role !== "admin" && u.name.toLowerCase() !== "admin" && u.id !== "user-admin"
  );

  // Auto-reassign if task was previously assigned to Admin
  useEffect(() => {
    if (task && assignableUsers.length > 0) {
      const isAssignedToAdmin = task.assignedTo.some((id) =>
        users.some((u) => u.id === id && (u.role === "admin" || u.name.toLowerCase() === "admin" || u.id === "user-admin"))
      );
      if (isAssignedToAdmin) {
        updateTask(task.id, { assignedTo: [assignableUsers[0].id] });
      }
    }
  }, [task?.id, task?.assignedTo, assignableUsers, users, updateTask]);

  if (!activeTaskId || !task) return null;

  // Status Change Permissions: Only Admin, Director, or Manager can change task status / complete tasks!
  const canChangeStatus =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager";

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(task.id, newCommentText.trim());
    setNewCommentText("");
  };

  const renderLeadSourceBadge = (source?: LeadSource) => {
    switch (source) {
      case "showroom":
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">Showroom Visit</span>;
      case "digital":
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">Digital Lead</span>;
      case "reference":
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">Client Reference</span>;
      case "architect":
        return <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold">Architect Reference</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-bold">Direct Entry</span>;
    }
  };

  const canDelete = currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";
  const handoffHistoryList = task.handoffHistory || [];
  const commentsList = task.comments || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => setActiveTask(null)}
      />

      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            {project && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border text-xs font-semibold text-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHandoffOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Transfer project to another department"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Transfer Department</span>
            </button>
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm("Delete this task?")) {
                    deleteTask(task.id);
                  }
                }}
                className="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                title="Delete Task (Admin & Director Only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setActiveTask(null)}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className="w-full text-xl font-bold bg-transparent text-foreground focus:outline-none border-b border-transparent focus:border-brand-500 pb-1"
            />
          </div>

          {/* Metadata Controls Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-border/60 text-xs space-y-2 sm:space-y-0">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-muted-foreground font-semibold uppercase">Status</span>
                {!canChangeStatus && (
                  <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                )}
              </div>
              <select
                disabled={!canChangeStatus}
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                title={!canChangeStatus ? "Status change is restricted to Team Leader, Director, or Admin" : "Change Status"}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold uppercase focus:outline-none transition-all ${
                  !canChangeStatus ? "opacity-75 cursor-not-allowed bg-secondary/80 border-amber-500/40" : "cursor-pointer"
                } ${getStatusBadgeColor(task.status)}`}
              >
                {(project?.statuses || [
                  { id: "todo", name: "To Do" },
                  { id: "in_progress", name: "In Progress" },
                  { id: "done", name: "Done" },
                ]).map((st) => (
                  <option key={st.id} value={st.id} className="bg-card text-foreground">
                    {st.name}
                  </option>
                ))}
              </select>
              {!canChangeStatus && (
                <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                  🔒 Only Admin & Director can change status/complete. Please use &quot;Transfer Department&quot; above.
                </span>
              )}
            </div>

            <div>
              <span className="text-muted-foreground font-semibold uppercase block mb-1">Priority</span>
              <select
                value={task.priority}
                onChange={(e) => updateTaskPriority(task.id, e.target.value as TaskPriority)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold capitalize cursor-pointer focus:outline-none ${getPriorityBadgeColor(
                  task.priority
                )}`}
              >
                <option value="low" className="bg-card text-foreground">Low</option>
                <option value="medium" className="bg-card text-foreground">Medium</option>
                <option value="high" className="bg-card text-foreground">High</option>
                <option value="urgent" className="bg-card text-foreground">Urgent</option>
              </select>
            </div>

            <div>
              <span className="text-muted-foreground font-semibold uppercase block mb-1">Assigned To (Transfer)</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={
                    assignableUsers.some((u) => u.id === task.assignedTo[0])
                      ? task.assignedTo[0]
                      : assignableUsers[0]?.id || ""
                  }
                  onChange={(e) => {
                    const newUserId = e.target.value;
                    if (newUserId) {
                      updateTask(task.id, { assignedTo: [newUserId] });
                    }
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                >
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-semibold uppercase block mb-1">Due Date</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                {formatDate(task.dueDate) || "Not set"}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-border/40">
              <span className="text-muted-foreground font-semibold uppercase block mb-1">Kanban Sticky Note Color</span>
              <div className="flex items-center gap-2">
                <select
                  value={task.stickyColor || "default"}
                  onChange={(e) => updateTask(task.id, { stickyColor: e.target.value as any })}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer capitalize"
                >
                  <option value="default">Standard Card Style</option>
                  <option value="yellow">🟡 Yellow Sticky Note</option>
                  <option value="green">🟢 Green Sticky Note</option>
                  <option value="blue">🔵 Blue Sticky Note</option>
                  <option value="purple">🟣 Purple Sticky Note</option>
                  <option value="pink">🩷 Pink Sticky Note</option>
                  <option value="orange">🟠 Orange Sticky Note</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer & Lead Source Info Card */}
          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-brand-500 flex items-center gap-1.5 text-[11px]">
                <Building2 className="w-4 h-4" /> Customer & Site Information
              </span>
              {renderLeadSourceBadge(task.leadSource)}
            </div>
            <div className="grid grid-cols-2 gap-3 text-foreground pt-1">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Customer Name</span>
                <span className="font-bold text-sm">{task.customerName || project?.customerName || "Rajeshbhai Patel"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone Number</span>
                <span className="font-semibold flex items-center gap-1 text-sm">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {task.customerPhone || project?.customerPhone || "+91 98250 12345"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Site Address / Location</span>
                <span className="font-medium flex items-center gap-1.5 text-foreground/90">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {task.siteAddress || project?.siteAddress || "Satellite Bungalows, Satellite, Ahmedabad"}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="pt-2 border-t border-border/60">
            <TaskAttachments task={task} />
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Description / Requirements
            </h4>
            <textarea
              rows={3}
              value={task.description || ""}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              placeholder="Add detailed task instructions, customer specifications, or acceptance criteria..."
              className="w-full p-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
          </div>

          {/* Department Transfer History Section (Replaces Checklist & Subtasks) */}
          <div className="space-y-3.5 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-brand-500" />
                <span>Department Transfer History ({handoffHistoryList.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setHandoffOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/30 text-xs font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>+ Transfer Next Dept</span>
              </button>
            </div>

            {handoffHistoryList.length > 0 ? (
              <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:via-brand-500/40 before:to-transparent">
                {handoffHistoryList.map((ho, idx) => (
                  <div key={ho.id || idx} className="relative group">
                    {/* Step Marker Dot */}
                    <div className="absolute -left-5 top-2.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-card border border-white dark:border-zinc-900 shadow-xs" />

                    <div className="p-3.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/60 transition-all space-y-2">
                      {/* Department Route Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-foreground">
                            {ho.fromDept}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span className="px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-400 font-bold">
                            {ho.toDept}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(ho.timestamp)}
                        </span>
                      </div>

                      {/* Remarks / Handover Notes Quote */}
                      {ho.remark && (
                        <div className="p-2.5 rounded-lg bg-card/60 border border-border/40 text-xs text-foreground/90 font-medium leading-relaxed flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Transfer Remarks:</span>
                            <p className="italic">&ldquo;{ho.remark}&rdquo;</p>
                          </div>
                        </div>
                      )}

                      {/* Personnel Handover Footer */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            By <strong className="text-foreground">{ho.fromUser}</strong> → Assigned to <strong className="text-foreground">{ho.toUser}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDate(ho.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-border/80 bg-secondary/20 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-foreground">No Department Transfers Yet</h5>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    This task is currently active in its primary department. When your work is done, transfer it to the next department to log the handoff.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHandoffOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Transfer Department Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Remarks & Discussion Feed (Modern Comment Style) */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span>Remarks & Discussion Feed ({commentsList.length})</span>
              </h4>
              <span className="text-[11px] text-muted-foreground">Discussion notes & site updates</span>
            </div>

            {/* Comment Thread */}
            <div className="space-y-3">
              {commentsList.length > 0 ? (
                commentsList.map((comm) => {
                  const isTransferLog = comm.content.includes("Department Transfer");
                  const canDeleteComm =
                    currentUser.id === comm.userId ||
                    currentUser.role === "admin" ||
                    currentUser.role === "director";

                  return (
                    <div
                      key={comm.id}
                      className={`group p-3.5 rounded-2xl border transition-all ${
                        isTransferLog
                          ? "bg-brand-500/5 border-brand-500/30"
                          : "bg-secondary/35 hover:bg-secondary/50 border-border/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={comm.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comm.user?.name || "User")}`}
                          alt={comm.user?.name || "User"}
                          className="w-8 h-8 rounded-full object-cover border border-border shrink-0 shadow-xs"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-foreground">{comm.user?.name || "Team Member"}</span>
                              {isTransferLog && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-400 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" /> Transfer Note
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {formatTimeAgo(comm.createdAt)}
                              </span>
                              {canDeleteComm && (
                                <button
                                  type="button"
                                  onClick={() => deleteComment?.(task.id, comm.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-opacity"
                                  title="Delete remark"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-foreground/90 leading-relaxed space-y-1">
                            {comm.content.split("\n").map((line, lineIdx) => {
                              if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;
                              const parts = line.split(/(\*\*.*?\*\*)/g);
                              return (
                                <p key={lineIdx}>
                                  {parts.map((part, pIdx) => {
                                    if (part.startsWith("**") && part.endsWith("**")) {
                                      return (
                                        <strong key={pIdx} className="font-semibold text-foreground">
                                          {part.slice(2, -2)}
                                        </strong>
                                      );
                                    }
                                    return part;
                                  })}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border/60 bg-secondary/15 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground/80">No remarks posted yet.</p>
                  <p className="text-[11px]">Add client discussion notes, site remarks, or progress updates below.</p>
                </div>
              )}
            </div>

            {/* Comment Composer */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="p-3 rounded-2xl border border-border bg-secondary/30 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all space-y-2">
                <div className="flex items-start gap-2.5">
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-border shrink-0 mt-0.5"
                  />
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Write a remark, customer discussion note, or site update... (Ctrl + Enter to send)"
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span className="hidden sm:inline">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-foreground font-semibold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-foreground font-semibold">Enter</kbd> to submit
                  </span>
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="ml-auto px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-brand-500/20 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Remark</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </aside>

      <HandoffModal
        task={task}
        isOpen={isHandoffOpen}
        onClose={() => setHandoffOpen(false)}
      />
    </>
  );
};
