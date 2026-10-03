"use client";

import React, { useState } from "react";
import { Task, TaskAttachment, WorkCategory } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Trash2,
  ExternalLink,
  FileCode,
  Compass,
  DollarSign,
  Presentation,
  Eye,
  Lock,
  ShieldCheck,
  Upload,
  Sparkles,
  Layers,
} from "lucide-react";

interface TaskAttachmentsProps {
  task: Task;
}

const WORK_CATEGORIES: { id: WorkCategory; label: string; icon: any; color: string; bg: string }[] = [
  { id: "2d", label: "2D Floor Plans & CAD", icon: FileCode, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  { id: "site_image", label: "Site Photographs", icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { id: "3d_renders", label: "3D Renders & Elevation", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30" },
  { id: "quotation", label: "Quotation & BOQ", icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  { id: "presentation", label: "Client Presentation", icon: Presentation, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" },
];

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ task }) => {
  const { updateTask, currentUser, projects } = useAppStore();
  const [selectedCat, setSelectedCat] = useState<WorkCategory | "all">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<WorkCategory>("2d");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "jpg" | "png" | "cad">("pdf");
  const [fileUrl, setFileUrl] = useState("");

  const project = projects.find((p) => p.id === task.projectId);
  const taskDept = project?.name || "Sales";

  const attachments = task.attachments || [];

  // Permissions Access Control Rule:
  // Admin, Director & Manager see ALL work uploads across ALL departments.
  // Regular users/team members only see their own department's work or their own uploaded work.
  const canViewAll = currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "manager";

  const visibleAttachments = attachments.filter((att) => {
    // 1. Role Scope Filter
    if (!canViewAll) {
      const isMyUpload = att.uploaderId === currentUser.id || att.uploadedBy === currentUser.name;
      const isMyDept = att.department === currentUser.department || att.department === taskDept;
      if (!isMyUpload && !isMyDept && att.department) {
        return false;
      }
    }
    // 2. Category Filter
    if (selectedCat !== "all") {
      return att.category === selectedCat;
    }
    return true;
  });

  const handleFileUploadLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      if (res) setFileUrl(res);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName.trim(),
      url: fileUrl.trim() || (fileType === "pdf" ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" : "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"),
      type: fileType,
      size: fileType === "pdf" ? "2.4 MB" : "4.8 MB",
      category: uploadCategory,
      department: taskDept,
      uploaderId: currentUser.id,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    updateTask(task.id, {
      attachments: [newAttachment, ...attachments],
    });

    setFileName("");
    setFileUrl("");
    setIsAdding(false);
  };

  const handleDeleteAttachment = (attId: string) => {
    const updated = attachments.filter((a) => a.id !== attId);
    updateTask(task.id, { attachments: updated });
  };

  const getCategoryInfo = (cat?: WorkCategory) => {
    return WORK_CATEGORIES.find((c) => c.id === cat) || WORK_CATEGORIES[0];
  };

  return (
    <div className="space-y-4">
      {/* Header & Access Control Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-brand-500" />
          <span>Work Uploads & Site Documents ({visibleAttachments.length})</span>
        </h3>

        {canViewAll ? (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Admin & Director Full Access
          </span>
        ) : (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> My Department View
          </span>
        )}
      </div>

      {/* 6 Category Grid Buttons (User Annotated Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {WORK_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const count = attachments.filter((a) => a.category === cat.id).length;
          const isSelected = selectedCat === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCat(isSelected ? "all" : cat.id);
                setUploadCategory(cat.id);
              }}
              className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between h-20 ${
                isSelected
                  ? "border-brand-500 bg-brand-500/10 shadow-md ring-2 ring-brand-500/20"
                  : "border-border/80 hover:border-brand-500/40 bg-card/60 hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${cat.bg}`}>
                  <CatIcon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <span className="text-[11px] font-extrabold text-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border">
                  {count}
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-foreground block truncate group-hover:text-brand-500 transition-colors">
                  {cat.label}
                </span>
                <span className="text-[9px] text-muted-foreground block truncate">Click to filter or upload</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload Action Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setSelectedCat("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
            selectedCat === "all"
              ? "bg-brand-500/10 text-brand-500 border-brand-500/30"
              : "text-muted-foreground border-border hover:bg-secondary"
          }`}
        >
          Show All Work Files ({visibleAttachments.length})
        </button>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Work Document</span>
        </button>
      </div>

      {/* Add Work Form */}
      {isAdding && (
        <form onSubmit={handleAddAttachment} className="p-4 rounded-2xl bg-secondary/50 border border-brand-500/30 space-y-3 animate-in fade-in duration-150 shadow-lg">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-brand-500" /> Upload Work under {taskDept} Department
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Work Category *</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as WorkCategory)}
                className="w-full px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
              >
                {WORK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">File Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="jpg">JPG Photograph</option>
                <option value="png">PNG Drawing</option>
                <option value="cad">CAD / 2D File</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              File Name / Work Title *
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. 2D_Kitchen_Site_Plan.pdf or Quotation_Revision_2.pdf"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* File Browser Upload */}
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Upload File from Device or Enter URL
            </label>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="task-file-upload-input"
                className="p-3 rounded-xl border border-dashed border-brand-500/40 hover:border-brand-500 bg-brand-500/5 hover:bg-brand-500/10 text-brand-500 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Click to browse file from device</span>
                <input
                  id="task-file-upload-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileUploadLocal}
                />
              </label>

              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Or paste file link (https://...)"
                className="w-full px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-1.5 text-xs rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-md"
            >
              Upload Work
            </button>
          </div>
        </form>
      )}

      {/* Attachment Cards List */}
      {visibleAttachments.length === 0 ? (
        <div className="p-5 text-center text-xs text-muted-foreground/60 border border-dashed border-border rounded-2xl bg-secondary/20 space-y-1">
          <p className="font-semibold text-foreground">No work uploads found for this selection.</p>
          <p className="text-[11px]">Click any category box above to upload 2D plans, 3D renders, site photos, quotations or presentations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleAttachments.map((att) => {
            const catInfo = getCategoryInfo(att.category);
            const CatIcon = catInfo.icon;

            return (
              <div
                key={att.id}
                className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-brand-500/40 flex items-start justify-between group transition-all space-y-2"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl border shrink-0 ${catInfo.bg}`}>
                    <CatIcon className={`w-4 h-4 ${catInfo.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border mb-1 ${catInfo.bg} ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-brand-400 transition-colors">
                      {att.name}
                    </p>
                    <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                      <p className="truncate">
                        Dept: <strong className="text-foreground">{att.department || taskDept}</strong> • {att.uploadedBy}
                      </p>
                      <p className="text-[9px] opacity-80">{att.size} • {new Date(att.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-brand-500 transition-colors"
                    title="View Work File"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {(canViewAll || att.uploaderId === currentUser.id || att.uploadedBy === currentUser.name) && (
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Delete Work File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
