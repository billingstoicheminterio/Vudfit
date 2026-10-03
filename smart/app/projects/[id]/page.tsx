"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ViewSwitcher, ProjectViewType } from "@/components/projects/ViewSwitcher";
import { TaskListView } from "@/components/projects/TaskListView";
import { TaskKanbanView } from "@/components/projects/TaskKanbanView";
import { TaskGanttView } from "@/components/projects/TaskGanttView";
import { TaskCalendarView } from "@/components/projects/TaskCalendarView";
import {
  FolderKanban,
  Calendar,
  Users,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const {
    projects,
    tasks,
    setCreateTaskOpen,
    users,
    currentUser,
    taskFilterUser,
  } = useAppStore();

  const [activeView, setActiveView] = useState<ProjectViewType>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");

  const project = projects.find((p) => p.id === projectId) || projects[0];

  // Filter tasks for this project
  const projectTasks = tasks.filter((t) => t.projectId === project?.id);

  const canViewAll =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.role === "team_leader" ||
    (currentUser.permissions?.canViewAllTasks ?? false);

  const filteredTasks = projectTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      selectedPriority === "all" || t.priority === selectedPriority;

    let matchesUser = true;
    if (!canViewAll || taskFilterUser === "my_tasks") {
      matchesUser = t.assignedTo.includes(currentUser.id) || t.createdBy === currentUser.id;
    } else if (taskFilterUser !== "all") {
      matchesUser = t.assignedTo.includes(taskFilterUser) || t.createdBy === taskFilterUser;
    }

    return matchesSearch && matchesPriority && matchesUser;
  });

  const completedCount = projectTasks.filter((t) => t.status === "done").length;
  const totalCount = projectTasks.length;
  const progressPct = Math.round((completedCount / (totalCount || 1)) * 100);

  if (!project) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full pb-8">
      {/* Project Banner Header */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-lg space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style={{ backgroundColor: project.color }}
            >
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                  {project.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                  Active Project
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {project.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateTaskOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Sub-header Details bar */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              Target: {formatDate(project.endDate) || "Ongoing"}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {completedCount} of {totalCount} tasks completed ({progressPct}%)
            </span>
          </div>

          {/* Members list */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Team:</span>
            <div className="flex items-center -space-x-2">
              {users.map((u) => (
                <img
                  key={u.id}
                  src={u.avatar}
                  alt={u.name}
                  className="w-6 h-6 rounded-full object-cover border-2 border-card"
                  title={u.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <ViewSwitcher
        activeView={activeView}
        onViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        onNewTaskClick={() => setCreateTaskOpen(true)}
      />

      {/* Render Active View */}
      {activeView === "list" && (
        <TaskListView tasks={filteredTasks} projectName={project.name} />
      )}
      {activeView === "kanban" && (
        <TaskKanbanView tasks={filteredTasks} projectName={project.name} />
      )}
      {activeView === "gantt" && <TaskGanttView tasks={filteredTasks} />}
      {activeView === "calendar" && <TaskCalendarView tasks={filteredTasks} />}
    </div>
  );
}
