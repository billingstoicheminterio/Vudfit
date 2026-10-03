"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Presentation,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Building,
  CheckSquare,
  DollarSign,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DepartmentReviewPptModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { projects, tasks, deals, currentUser, brandSettings } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "closed").length;
  const overallRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalPipelineVal = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  const handleDownloadPPTX = async () => {
    try {
      setIsGenerating(true);
      const { generateDepartmentReviewPPT } = await import("@/lib/pptGeneratorService");
      await generateDepartmentReviewPPT({
        projects,
        tasks,
        deals,
        brandName: brandSettings.brandName || "VUDFIT",
        user: currentUser.name,
      });
    } catch (err) {
      console.error("PPT Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Slides Data for Live Preview Carousel
  const slides = [
    // Slide 1: Cover
    {
      title: `${brandSettings.brandName || "VUDFIT"} Executive Review`,
      type: "cover",
      content: (
        <div className="h-full bg-slate-900 text-white p-8 flex flex-col justify-center relative overflow-hidden rounded-2xl border border-slate-700">
          <div className="w-2 h-32 bg-amber-500 absolute left-6 top-1/2 -translate-y-1/2 rounded-full" />
          <div className="ml-6 space-y-3">
            <span className="text-amber-400 font-extrabold text-2xl tracking-wider block">
              {(brandSettings.brandName || "VUDFIT").toUpperCase()}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              All-Department Performance & Operations Review
            </h2>
            <p className="text-sm text-slate-400">
              Executive Project Progress, Task Ratios, CRM Pipeline & Site Operations Review
            </p>
            <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</span>
              <span>Presenter: <strong className="text-white">{currentUser.name}</strong></span>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 2: Executive Summary Table
    {
      title: "1. Executive Summary — All Departments Overview",
      type: "summary",
      content: (
        <div className="h-full bg-slate-50 dark:bg-slate-900/60 p-6 flex flex-col justify-between rounded-2xl border border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">
              All-Department Key Performance Indicators
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-xs text-muted-foreground font-semibold block uppercase">Active Departments</span>
                <span className="text-2xl font-extrabold text-blue-600 block mt-1">{projects.length}</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-xs text-muted-foreground font-semibold block uppercase">Work Completion Ratio</span>
                <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{overallRatio}%</span>
                <span className="text-[10px] text-muted-foreground">{completedTasks} of {totalTasks} tasks finished</span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                <span className="text-xs text-muted-foreground font-semibold block uppercase">CRM Pipeline Value</span>
                <span className="text-2xl font-extrabold text-amber-500 block mt-1">{formatCurrency(totalPipelineVal)}</span>
              </div>
            </div>

            {/* Department Summary Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-2.5">Department Name</th>
                    <th className="p-2.5">Total Tasks</th>
                    <th className="p-2.5">Completed</th>
                    <th className="p-2.5">Work Completion Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((proj) => {
                    const pTasks = tasks.filter((t) => t.projectId === proj.id);
                    const done = pTasks.filter((t) => t.status === "done" || t.status === "closed").length;
                    const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;

                    return (
                      <tr key={proj.id} className="hover:bg-secondary/40">
                        <td className="p-2.5 font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proj.color }} />
                          {proj.name}
                        </td>
                        <td className="p-2.5 font-semibold">{pTasks.length}</td>
                        <td className="p-2.5 text-emerald-600 font-bold">{done}</td>
                        <td className="p-2.5 font-extrabold text-brand-500">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ),
    },

    // Individual Department Deep Dives
    ...projects.map((proj, idx) => {
      const pTasks = tasks.filter((t) => t.projectId === proj.id);
      const done = pTasks.filter((t) => t.status === "done" || t.status === "closed").length;

      return {
        title: `${idx + 2}. Department Review: ${proj.name}`,
        type: "dept",
        content: (
          <div className="h-full bg-slate-50 dark:bg-slate-900/60 p-6 flex flex-col justify-between rounded-2xl border border-border">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }} />
                  {proj.name} Department Deep-Dive
                </h3>
                <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                  {pTasks.length} Active Tasks
                </span>
              </div>

              {/* Department Task Table */}
              <div className="overflow-hidden rounded-xl border border-border bg-card mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-2">Task Title</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Work Files</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pTasks.slice(0, 4).map((t) => (
                      <tr key={t.id}>
                        <td className="p-2 font-semibold text-foreground truncate max-w-[200px]">{t.title}</td>
                        <td className="p-2 uppercase text-[10px] font-bold">{t.status.replace("_", " ")}</td>
                        <td className="p-2 capitalize font-semibold">{t.priority}</td>
                        <td className="p-2 font-bold text-brand-500">{(t.attachments || []).length} Uploads</td>
                      </tr>
                    ))}
                    {pTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          No active tasks in this department.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Department Key Action Notes */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                <h4 className="font-bold text-amber-400">Department Executive Notes:</h4>
                <p className="text-slate-300 leading-relaxed">
                  • 2D site measurements & 3D render designs reviewed for current workflow phase.
                  <br />
                  • Work completion ratio currently at {pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0}%.
                </p>
              </div>
            </div>
          </div>
        ),
      };
    }),

    // Final Action Plan Slide
    {
      title: "Executive Action Plan & Next Steps",
      type: "conclusion",
      content: (
        <div className="h-full bg-slate-900 text-white p-8 flex flex-col justify-between rounded-2xl border border-slate-700">
          <div>
            <h3 className="text-2xl font-extrabold text-amber-400 mb-6">
              Action Plan & Executive Next Steps
            </h3>
            <div className="space-y-4 text-sm text-slate-200">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                1. Review pending 2D design layouts & 3D renders for immediate client sign-off.
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                2. Accelerated CNC cutting & material procurement for high-priority production tasks.
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                3. On-site installation quality check for completed kitchen & wardrobe projects.
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                4. Next weekly all-department sync scheduled with Directors and Team Leaders.
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 text-center">
            {brandSettings.brandName || "VUDFIT"} Management System • Confidential
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                1-Click All-Department Review PPT Generator
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate & Download PowerPoint (.pptx) presentation for executive meetings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Carousel Preview Header */}
        <div className="p-4 bg-secondary/30 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              Slide Preview ({currentSlideIndex + 1} of {slides.length}):
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              {slides[currentSlideIndex].title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
              className="p-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Live Canvas */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center min-h-[360px]">
          <div className="w-full max-w-2xl h-[340px] shadow-2xl transition-all duration-300">
            {slides[currentSlideIndex].content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Includes Sales, Back Office, Production & Service data</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadPPTX}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? "Generating PPT..." : "Download PowerPoint (.pptx)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
