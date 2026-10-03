"use client";

import React, { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task, TaskStatus } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  Plus,
  Calendar,
  CheckSquare,
  MessageSquare,
  Play,
  Clock,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";
import {
  formatDate,
  getPriorityBadgeColor,
  cn,
} from "@/lib/utils";

interface TaskKanbanViewProps {
  tasks: Task[];
  projectName: string;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-slate-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "in_review", title: "In Review", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

const STICKY_COLOR_MAP: Record<string, { bg: string; border: string }> = {
  yellow: { bg: "bg-amber-100/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100", border: "border-amber-300 dark:border-amber-700/60 shadow-amber-500/10" },
  green: { bg: "bg-emerald-100/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100", border: "border-emerald-300 dark:border-emerald-700/60 shadow-emerald-500/10" },
  blue: { bg: "bg-sky-100/90 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100", border: "border-sky-300 dark:border-sky-700/60 shadow-sky-500/10" },
  purple: { bg: "bg-purple-100/90 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100", border: "border-purple-300 dark:border-purple-700/60 shadow-purple-500/10" },
  pink: { bg: "bg-rose-100/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100", border: "border-rose-300 dark:border-rose-700/60 shadow-rose-500/10" },
  orange: { bg: "bg-orange-100/90 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100", border: "border-orange-300 dark:border-orange-700/60 shadow-orange-500/10" },
  default: { bg: "bg-card text-foreground", border: "border-border/90 hover:border-brand-500/40" },
};

const STICKY_OPTIONS = [
  { id: "yellow", bg: "bg-amber-400" },
  { id: "green", bg: "bg-emerald-400" },
  { id: "blue", bg: "bg-sky-400" },
  { id: "purple", bg: "bg-purple-400" },
  { id: "pink", bg: "bg-rose-400" },
  { id: "orange", bg: "bg-orange-400" },
  { id: "default", bg: "bg-slate-300 dark:bg-slate-700" },
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ tasks, projectName }) => {
  const { projects, reorderTask, setActiveTask, startTimer, users, setCreateTaskOpen, updateTask, currentUser } = useAppStore();

  const currentProject = projects.find((p) => p.name === projectName) || projects[0];
  const columns = currentProject?.statuses || [
    { id: "todo", name: "To Do", color: "bg-slate-500" },
    { id: "in_progress", name: "In Progress", color: "bg-blue-500" },
    { id: "in_review", name: "In Review", color: "bg-purple-500" },
    { id: "done", name: "Done", color: "bg-emerald-500" },
  ];

  const canChangeStatus =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.role === "team_leader";

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!canChangeStatus && destination.droppableId !== source.droppableId) {
      alert("Status change is restricted. Team members can only transfer tasks to another department.");
      return;
    }

    if (destination.droppableId === "done" && currentUser.role !== "admin" && currentUser.role !== "director" && currentUser.role !== "manager") {
      alert("Permission Denied: Team members cannot mark tasks as Done. Only Admin, Director, and Manager can complete tasks. Please use 'Transfer Department' instead.");
      return;
    }

    reorderTask(
      draggableId,
      destination.droppableId as TaskStatus,
      destination.index
    );
  };

  const { tasksByStatus, hoursByStatus } = useMemo(() => {
    const tasksMap: Record<string, Task[]> = {};
    const hoursMap: Record<string, number> = {};

    const uniqueTasks = Array.from(
      new Map(
        [...tasks]
          .sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0))
          .map((t) => [t.id, t])
      ).values()
    );

    for (const t of uniqueTasks) {
      if (!tasksMap[t.status]) {
        tasksMap[t.status] = [];
        hoursMap[t.status] = 0;
      }
      tasksMap[t.status].push(t);
      hoursMap[t.status] += t.estimatedHours || 0;
    }

    return { tasksByStatus: tasksMap, hoursByStatus: hoursMap };
  }, [tasks]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-220px)] w-full">
        {columns.map((col) => {
          const colTasks = tasksByStatus[col.id] || [];
          const totalHours = hoursByStatus[col.id] || 0;

          return (
            <div
              key={col.id}
              className="w-72 sm:w-80 shrink-0 bg-card/60 rounded-2xl border border-border/80 flex flex-col max-h-full shadow-sm"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-secondary/30 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    {col.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold text-[11px]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-muted-foreground mr-1">
                    {totalHours}h
                  </span>
                  <button
                    onClick={() => setCreateTaskOpen(true)}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 space-y-3 flex-1 overflow-y-auto min-h-[150px] rounded-b-2xl ${
                      snapshot.isDraggingOver ? "bg-brand-500/5" : ""
                    }`}
                  >
                    {colTasks.map((task, index) => {
                      const subtasksDone = task.subtasks.filter((s) => s.isCompleted).length;
                      const assignedUsers = users.filter((u) => task.assignedTo.includes(u.id));
                      const stickyStyle = STICKY_COLOR_MAP[task.stickyColor || "default"] || STICKY_COLOR_MAP.default;

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                              onClick={() => setActiveTask(task.id)}
                              className={cn(
                                "p-3.5 sm:p-4 rounded-xl border shadow-sm cursor-pointer space-y-3 group select-none relative break-words overflow-hidden",
                                stickyStyle.bg,
                                stickyStyle.border,
                                snapshot.isDragging
                                  ? "shadow-2xl ring-2 ring-brand-500 z-50 opacity-95"
                                  : "hover:shadow-md transition-shadow"
                              )}
                            >
                              {/* Priority & Sticky Color Palette Header */}
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ${getPriorityBadgeColor(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>

                                {/* Interactive Sticky Color Palette Buttons */}
                                <div
                                  className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity bg-card/60 p-1 rounded-lg border border-border/40 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {STICKY_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() =>
                                        updateTask(task.id, {
                                          stickyColor: opt.id as any,
                                        })
                                      }
                                      className={`w-3.5 h-3.5 rounded-full ${opt.bg} hover:scale-125 transition-transform ${
                                        task.stickyColor === opt.id ? "ring-2 ring-brand-500 scale-110" : ""
                                      }`}
                                      title={`Set ${opt.id} sticky color`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-brand-400 transition-colors break-words">
                                {task.title}
                              </h4>

                              {/* Description Preview */}
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                                  {task.description}
                                </p>
                              )}

                              {/* Footer Metadata */}
                              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.handoffHistory && task.handoffHistory.length > 0 && (
                                    <span className="flex items-center gap-1 text-brand-500 font-medium" title={`${task.handoffHistory.length} department transfers`}>
                                      <ArrowRight className="w-3 h-3" />
                                      {task.handoffHistory.length}
                                    </span>
                                  )}
                                  {task.comments.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {task.comments.length}
                                    </span>
                                  )}
                                </div>

                                {/* Assignee Avatars */}
                                <div className="flex items-center -space-x-1.5">
                                  {assignedUsers.map((u) => (
                                    <img
                                      key={u.id}
                                      src={u.avatar}
                                      alt={u.name}
                                      className="w-5 h-5 rounded-full object-cover border border-card"
                                      title={u.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {colTasks.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                        No tasks in {col.name}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
