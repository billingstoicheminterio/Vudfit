"use client";

import React from "react";
import { Task, TaskPriority, TaskStatus, User } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Play,
  Trash2,
  MessageSquare,
  CheckSquare,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
import {
  formatDate,
  getPriorityBadgeColor,
  getStatusBadgeColor,
} from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  projectName: string;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, projectName }) => {
  const {
    projects,
    updateTaskStatus,
    updateTaskPriority,
    deleteTask,
    setActiveTask,
    startTimer,
    users,
    currentUser,
    addNotification,
  } = useAppStore();

  const canCompleteTask =
    currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";

  const canChangeStatus =
    currentUser.role === "admin" ||
    currentUser.role === "director" ||
    currentUser.role === "manager" ||
    currentUser.role === "team_leader";

  const canDelete =
    currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
        <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="text-base font-semibold text-foreground">No tasks found</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Create a new task or adjust your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-secondary/50 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Done</th>
              <th className="py-3 px-4 min-w-[240px]">Task Title</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 w-32">Priority</th>
              <th className="py-3 px-4 w-36">Assignee</th>
              <th className="py-3 px-4 w-36">Due Date</th>
              <th className="py-3 px-4 w-28">Est. Hours</th>
              <th className="py-3 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {tasks.map((task) => {
              const isDone = task.status === "done" || task.status === "closed";
              const subtasksDone = task.subtasks.filter((s) => s.isCompleted).length;
              const assignedUser = users.find((u) => task.assignedTo.includes(u.id));
              const taskProject = projects.find((p) => p.id === task.projectId);
              const statusOptions = taskProject?.statuses || [
                { id: "todo", name: "To Do" },
                { id: "in_progress", name: "In Progress" },
                { id: "done", name: "Done" },
              ];

              return (
                <tr
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                >
                  {/* Status Checkbox / Transfer Action */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {canCompleteTask ? (
                      <button
                        onClick={() => updateTaskStatus(task.id, isDone ? statusOptions[0]?.id : (statusOptions[statusOptions.length - 1]?.id || "done"))}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-colors ${
                          isDone
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/40 hover:border-brand-500"
                        }`}
                        title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveTask(task.id);
                          addNotification({
                            title: "Transfer Task 🔄",
                            message: "Team members cannot complete tasks. Click 'Transfer Department' in the task panel.",
                            type: "general",
                          });
                        }}
                        className="px-2 py-1 rounded-md border border-brand-500/30 bg-brand-500/10 text-brand-600 hover:bg-brand-500 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 mx-auto"
                        title="Team members can only transfer tasks"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Transfer</span>
                      </button>
                    )}
                  </td>

                  {/* Title & Metadata */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`font-semibold text-foreground group-hover:text-brand-400 transition-colors ${
                          isDone ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Transfers & Comments Counter */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {task.handoffHistory && task.handoffHistory.length > 0 && (
                          <span className="flex items-center gap-1 text-brand-500 font-medium" title={`${task.handoffHistory.length} department transfers`}>
                            <ArrowRight className="w-3 h-3" />
                            {task.handoffHistory.length} transfers
                          </span>
                        )}
                        {task.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-brand-400" />
                            {task.comments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status Selector */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      disabled={!canChangeStatus}
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      title={!canChangeStatus ? "Status change is restricted to Team Leader, Director, or Admin" : "Change Status"}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold uppercase focus:outline-none ${
                        !canChangeStatus ? "opacity-75 cursor-not-allowed bg-secondary/80" : "cursor-pointer"
                      } ${getStatusBadgeColor(task.status)}`}
                    >
                      {statusOptions.map((st) => (
                        <option key={st.id} value={st.id} className="bg-card text-foreground">
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Priority Selector */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
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
                  </td>

                  {/* Assignee Avatar */}
                  <td className="py-3.5 px-4">
                    {assignedUser ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={assignedUser.avatar}
                          alt={assignedUser.name}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                        <span className="text-xs font-medium text-foreground truncate max-w-[90px]">
                          {assignedUser.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" /> Unassigned
                      </span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatDate(task.dueDate) || "No due date"}</span>
                    </div>
                  </td>

                  {/* Estimated Hours */}
                  <td className="py-3.5 px-4 text-xs font-mono font-medium text-foreground">
                    {task.estimatedHours > 0 ? `${task.estimatedHours}h` : "—"}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {canDelete && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (confirm("Delete this task?")) {
                              deleteTask(task.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Delete Task (Admin & Director Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
