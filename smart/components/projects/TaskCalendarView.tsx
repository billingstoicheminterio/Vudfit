"use client";

import React, { useState } from "react";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { getPriorityBadgeColor } from "@/lib/utils";

interface TaskCalendarViewProps {
  tasks: Task[];
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks }) => {
  const { setActiveTask } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState("August 2026");

  // 35 Calendar Cells for August 2026 month view
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-bold text-foreground">{currentMonth}</h3>
        </div>

        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60">
          <button className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-semibold text-foreground">Today</span>
          <button className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Days Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          // Match tasks due around this day
          const dayTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.getDate() === day;
          });

          const isToday = day === 25; // Aug 25

          return (
            <div
              key={day}
              className={`min-h-[100px] p-2 rounded-xl border transition-all flex flex-col space-y-1 ${
                isToday
                  ? "bg-brand-500/10 border-brand-500/50 shadow-sm"
                  : "bg-secondary/20 border-border/60 hover:bg-secondary/40"
              }`}
            >
              <span
                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  isToday ? "bg-brand-600 text-white shadow-md" : "text-muted-foreground"
                }`}
              >
                {day}
              </span>

              <div className="space-y-1 overflow-y-auto flex-1">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTask(t.id)}
                    className="p-1.5 rounded-lg bg-card border border-border shadow-xs hover:border-brand-500/40 text-[11px] font-semibold text-foreground truncate cursor-pointer transition-colors"
                  >
                    <span className="text-brand-400 mr-1">•</span>
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
