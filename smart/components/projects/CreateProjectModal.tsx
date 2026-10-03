"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, FolderKanban } from "lucide-react";

const PROJECT_COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
];

export const CreateProjectModal = () => {
  const {
    isCreateProjectOpen,
    setCreateProjectOpen,
    activeWorkspaceId,
    addProject,
    currentUser,
  } = useAppStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isCreateProjectOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      workspaceId: activeWorkspaceId,
      name: name.trim(),
      description: description.trim(),
      color,
      icon: "FolderKanban",
      status: "active",
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdBy: currentUser.id,
      sections: [
        { id: `sec-${Date.now()}-1`, projectId: "", name: "To Do", positionIndex: 0 },
        { id: `sec-${Date.now()}-2`, projectId: "", name: "In Progress", positionIndex: 1 },
        { id: `sec-${Date.now()}-3`, projectId: "", name: "Done", positionIndex: 2 },
      ],
      statuses: [
        { id: `st-${Date.now()}-1`, name: "To Do", color: "bg-blue-500" },
        { id: `st-${Date.now()}-2`, name: "In Progress", color: "bg-amber-500" },
        { id: `st-${Date.now()}-3`, name: "Done", color: "bg-emerald-500" },
      ],
    });

    setName("");
    setDescription("");
    setCreateProjectOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Create New Department</h2>
          </div>
          <button
            onClick={() => setCreateProjectOpen(false)}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales, Back office, Production"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-brand-500 ring-offset-2" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Target End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline department goals and key deliverables..."
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateProjectOpen(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all"
            >
              Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
