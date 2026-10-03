"use client";

import React from "react";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";
import { Calendar, Flag, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface TaskGanttViewProps {
  tasks: Task[];
}

export const TaskGanttView: React.FC<TaskGanttViewProps> = ({ tasks }) => {
  const { setActiveTask } = useAppStore();

  // Generate 21 days sequence for timeline grid starting from mid-August 2026
  const startDate = new Date("2026-08-18");
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden space-y-4 p-5">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Project Timeline & Visual Dependencies
          </h3>
          <p className="text-xs text-muted-foreground">
            Schedule schedule visualization, milestones, and task duration spans.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-brand-500" /> In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" /> Urgent
          </span>
        </div>
      </div>

      {/* Timeline Grid Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Days Row */}
          <div className="grid grid-cols-12 gap-1 border-b border-border/60 pb-2 text-center text-xs font-semibold text-muted-foreground">
            <div className="col-span-4 text-left px-3">Task Name</div>
            <div className="col-span-8 grid grid-cols-7 gap-1 text-[11px]">
              {days.slice(0, 7).map((day, idx) => (
                <div key={idx} className="p-1 rounded bg-secondary/40 font-mono">
                  {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Rows */}
          <div className="divide-y divide-border/40 py-2 space-y-2">
            {tasks.map((task, idx) => {
              const isDone = task.status === "done";
              const barColor = isDone
                ? "bg-emerald-500"
                : task.priority === "urgent"
                ? "bg-rose-500"
                : "bg-brand-500";

              return (
                <div
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className="grid grid-cols-12 gap-1 items-center py-2 hover:bg-secondary/30 rounded-xl px-2 cursor-pointer transition-colors group"
                >
                  {/* Task Info */}
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    <span className="font-semibold text-xs text-foreground truncate group-hover:text-brand-400">
                      {task.title}
                    </span>
                  </div>

                  {/* Visual Bar Span across timeline */}
                  <div className="col-span-8 grid grid-cols-7 gap-1 items-center">
                    <div
                      className={`col-span-4 ${
                        idx % 2 === 0 ? "col-start-1" : "col-start-3"
                      } h-7 rounded-lg ${barColor} text-white px-3 flex items-center justify-between text-[11px] font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-[1.01]`}
                    >
                      <span className="truncate">{formatDate(task.dueDate) || "Scheduled"}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Flag className="w-3 h-3 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
