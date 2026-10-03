"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import {
  ArrowRight,
  UserCheck,
  Building2,
  FileText,
  Send,
  X,
  MessageSquarePlus,
  CheckCircle2,
} from "lucide-react";

interface HandoffModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS = [
  { id: "Sales", name: "Sales Department", defaultProjId: "proj-1", defaultStatus: "quotation" },
  { id: "Measurement", name: "Measurement Department", defaultProjId: "proj-2", defaultStatus: "measurement" },
  { id: "BackOffice_2D", name: "Back Office (2D Design)", defaultProjId: "proj-2", defaultStatus: "2d_design" },
  { id: "BackOffice_3D", name: "Back Office (3D Design)", defaultProjId: "proj-2", defaultStatus: "3d_design" },
  { id: "Production_Bim", name: "Production (Pytha & Bim Saw)", defaultProjId: "proj-3", defaultStatus: "pytha_design" },
  { id: "Production_CNC", name: "Production (Edge Bend & CNC)", defaultProjId: "proj-3", defaultStatus: "cnc" },
  { id: "Packaging_Installation", name: "Packaging and installation", defaultProjId: "proj-5", defaultStatus: "qc_packaging" },
  { id: "Service", name: "Service & Support Department", defaultProjId: "proj-4", defaultStatus: "ticket_raised" },
];

export const HandoffModal: React.FC<HandoffModalProps> = ({ task, isOpen, onClose }) => {
  const { users, currentUser, updateTask, projects } = useAppStore();

  const currentProject = projects.find((p) => p.id === task.projectId);

  // Admin account is for management only; tasks can only be handed off to operational team members
  const assignableUsers = users.filter(
    (u) => u.role !== "admin" && u.name.toLowerCase() !== "admin" && u.id !== "user-admin"
  );

  const [targetDeptId, setTargetDeptId] = useState(DEPARTMENTS[1].id);
  const [assignedUserId, setAssignedUserId] = useState(assignableUsers[0]?.id || "");
  const [remark, setRemark] = useState("");

  if (!isOpen) return null;

  const handleHandoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) return;

    const targetDept = DEPARTMENTS.find((d) => d.id === targetDeptId) || DEPARTMENTS[1];
    const targetUser = users.find((u) => u.id === assignedUserId);

    const newHandoffRecord = {
      id: `ho-${Date.now()}`,
      fromDept: currentProject?.name || "Sales Department",
      toDept: targetDept.name,
      fromUser: currentUser.name,
      toUser: targetUser?.name || "Assigned Team Member",
      remark: remark.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add remark as a formal comment as well
    const newComment = {
      id: `comm-${Date.now()}`,
      taskId: task.id,
      userId: currentUser.id,
      user: currentUser,
      content: `🔄 **Department Transfer to ${targetDept.name}**\nAssigned to: **${targetUser?.name}**\n\n📝 **Handoff Notes:** ${remark.trim()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [...(task.handoffHistory || []), newHandoffRecord];
    const updatedComments = [newComment, ...task.comments];

    updateTask(task.id, {
      projectId: targetDept.defaultProjId,
      status: targetDept.defaultStatus,
      assignedTo: [assignedUserId],
      handoffHistory: updatedHistory,
      comments: updatedComments,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Transfer Project to Next Department</h2>
              <p className="text-xs text-muted-foreground">Hand off task with site measurement notes & customer specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleHandoff} className="p-6 space-y-4">
          {/* Current vs Target Dept Banner */}
          <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-500" />
              <div>
                <span className="text-muted-foreground block text-[10px]">CURRENT DEPT</span>
                <span className="font-bold text-foreground">{currentProject?.name || "Sales"}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-500" />
            <div>
              <span className="text-muted-foreground block text-[10px]">HANDOFF TO</span>
              <span className="font-bold text-brand-400">
                {DEPARTMENTS.find((d) => d.id === targetDeptId)?.name}
              </span>
            </div>
          </div>

          {/* Target Department Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Target Department *
            </label>
            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-card text-foreground">
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Team Member Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Assign Team Member in Target Dept *
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground font-medium"
            >
              {assignableUsers.map((usr) => (
                <option key={usr.id} value={usr.id} className="bg-card text-foreground">
                  {usr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mandatory Handoff Remarks */}
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-brand-500" /> Handoff Remarks & Customer Discussion Notes *
            </label>
            <textarea
              required
              rows={4}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Customer wants Glossy Acrylic finish with Blum Tandem boxes. Site measurement map PDF attached. Please create 2D elevation drawing."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              These remarks will be saved permanently in the project timeline for the next department team member to read.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Confirm Handoff & Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
