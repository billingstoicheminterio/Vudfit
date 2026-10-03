"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { TaskPriority, TaskStatus, LeadSource } from "@/lib/types";
import { X, Calendar, Clock, AlertCircle, User, FolderKanban, Building2, Phone, MapPin } from "lucide-react";

export const CreateTaskModal = () => {
  const {
    isCreateTaskOpen,
    setCreateTaskOpen,
    projects,
    activeProjectId,
    addTask,
    users,
    currentUser,
  } = useAppStore();

  // Admin account is for management only; tasks can only be assigned to operational team members
  const assignableUsers = users.filter(
    (u) => u.role !== "admin" && u.name.toLowerCase() !== "admin" && u.id !== "user-admin"
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(activeProjectId || (projects[0]?.id || ""));
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [assignedTo, setAssignedTo] = useState<string[]>([
    assignableUsers.some((u) => u.id === currentUser.id) ? currentUser.id : assignableUsers[0]?.id || "",
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [leadSource, setLeadSource] = useState<LeadSource>("showroom");

  const selectedProj = projects.find((p) => p.id === projectId) || projects[0];
  const projectStatuses = selectedProj?.statuses || [
    { id: "todo", name: "To Do" },
    { id: "in_progress", name: "In Progress" },
    { id: "in_review", name: "In Review" },
    { id: "done", name: "Done" },
  ];

  // Default status to first project status if current status not in project statuses
  const currentStatusValid = projectStatuses.some((st) => st.id === status);
  const activeStatus = currentStatusValid ? status : projectStatuses[0]?.id || "";

  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const newProj = projects.find((p) => p.id === newProjId);
    if (newProj && newProj.statuses && newProj.statuses.length > 0) {
      setStatus(newProj.statuses[0].id);
    }
  };

  if (!isCreateTaskOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      projectId,
      title: title.trim(),
      description: description.trim(),
      status: activeStatus,
      priority,
      dueDate: dueDate || undefined,
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: 0,
      createdBy: currentUser.id,
      assignedTo,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      siteAddress: siteAddress.trim() || undefined,
      leadSource,
      positionIndex: 0,
    });

    // Reset & Close
    setTitle("");
    setDescription("");
    setCreateTaskOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Create New Task</h2>
          <button
            onClick={() => setCreateTaskOpen(false)}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Project / Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rajeshbhai Patel - Villa Modular Kitchen & Bedroom"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
          </div>

          {/* Customer & Lead Source Details */}
          <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Customer & Site Lead Entry
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rajeshbhai Patel"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98250 12345"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Lead Source</label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                >
                  <option value="showroom">Direct Showroom Visit</option>
                  <option value="digital">Digital Lead (Web/Social)</option>
                  <option value="reference">Client Reference</option>
                  <option value="architect">Architect / Interior Reference</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Site Location / Address</label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="e.g. Satellite, Ahmedabad"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Project & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5" /> Department
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground capitalize"
              >
                <option value="low" className="bg-card text-foreground">Low</option>
                <option value="medium" className="bg-card text-foreground">Medium</option>
                <option value="high" className="bg-card text-foreground">High</option>
                <option value="urgent" className="bg-card text-foreground">Urgent</option>
              </select>
            </div>
          </div>

          {/* Status & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Initial Status
              </label>
              <select
                value={activeStatus}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              >
                {projectStatuses.map((st) => (
                  <option key={st.id} value={st.id} className="bg-card text-foreground">
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Assignee
              </label>
              <select
                value={assignedTo[0] || assignableUsers[0]?.id || ""}
                onChange={(e) => setAssignedTo([e.target.value])}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-medium"
              >
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card text-foreground">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Estimate Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Estimated Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Task Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or key links..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateTaskOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
