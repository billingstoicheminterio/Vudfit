"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Bell, X, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ToastNotifier: React.FC = () => {
  const { activeToast, dismissToast, setActiveTask } = useAppStore();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-16 right-6 z-50 pointer-events-auto max-w-sm w-full">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-brand-500/30 shadow-2xl shadow-brand-500/20 flex items-start gap-3 relative overflow-hidden group"
        >
          {/* Glowing Left Accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500 rounded-l-2xl" />

          {/* Bell Icon */}
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (activeToast.taskId) {
                setActiveTask(activeToast.taskId);
              }
              dismissToast();
            }}
          >
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <span>{activeToast.title}</span>
              <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-2 py-0.5 rounded-full">
                Just now
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>
            {activeToast.taskId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 mt-1 hover:underline">
                View Task Details <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={dismissToast}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
