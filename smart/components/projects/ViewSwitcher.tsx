"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import {
  List,
  Kanban,
  Calendar as CalendarIcon,
  GanttChartSquare,
  Filter,
  Plus,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectViewType = "list" | "kanban" | "gantt" | "calendar";

interface ViewSwitcherProps {
  activeView: ProjectViewType;
  onViewChange: (view: ProjectViewType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPriority: string;
  onPriorityChange: (p: string) => void;
  onNewTaskClick: () => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  onNewTaskClick,
}) => {
  const { users, currentUser, taskFilterUser, setTaskFilterUser } = useAppStore();

  const canViewAll =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.role === "team_leader" ||
    (currentUser.permissions?.canViewAllTasks ?? false);

  const views = [
    { id: "list", label: "List", icon: List },
    { id: "kanban", label: "Board", icon: Kanban },
    { id: "gantt", label: "Timeline / Gantt", icon: GanttChartSquare },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-3 px-3 border-b border-border/80 bg-card/40 rounded-xl mb-4">
      {/* Left: View Tabs */}
      <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id as ProjectViewType)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                isActive
                  ? "bg-card text-brand-500 shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: User Filter & Search Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Permission Indicator */}
        {!canViewAll ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
            <UserCheck className="w-3.5 h-3.5" />
            <span>🔐 Restricted: Your Tasks Only</span>
          </div>
        ) : (
          <>
            {/* Quick 'My Tasks' Toggle */}
            <button
              onClick={() =>
                setTaskFilterUser(taskFilterUser === "my_tasks" ? "all" : "my_tasks")
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                taskFilterUser === "my_tasks"
                  ? "bg-brand-500/15 border-brand-500/40 text-brand-500 shadow-sm"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
              )}
              title="Filter tasks assigned to or created by you"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Tasks Only</span>
            </button>

            {/* User Select Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-brand-500" />
              <select
                value={taskFilterUser}
                onChange={(e) => setTaskFilterUser(e.target.value)}
                className="bg-transparent text-foreground font-medium focus:outline-none text-xs cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">All Team Tasks</option>
                <option value="my_tasks">My Tasks ({currentUser.name})</option>
                <optgroup label="Filter by User">
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace("_", " ")})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </>
        )}

        {/* Project Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tasks..."
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground w-36 sm:w-44"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/40 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-transparent text-foreground font-medium focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onNewTaskClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};
