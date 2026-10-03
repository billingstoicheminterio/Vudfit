"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ChevronDown, Plus, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, isSidebarCollapsed } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="relative w-full px-2 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-2 rounded-xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-all text-left group",
          isSidebarCollapsed && "justify-center p-2"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
            {activeWorkspace.name.substring(0, 2).toUpperCase()}
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-brand-500 transition-colors">
                {activeWorkspace.name}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeWorkspace.members.length} member{activeWorkspace.members.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
        {!isSidebarCollapsed && <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-2 right-2 mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                  ws.id === activeWorkspaceId
                    ? "bg-brand-500/10 text-brand-500 font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>
                {ws.id === activeWorkspaceId && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
              </button>
            ))}

            <div className="my-1 border-t border-border" />
            <button
              onClick={() => {
                alert("Create Workspace feature triggered");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
