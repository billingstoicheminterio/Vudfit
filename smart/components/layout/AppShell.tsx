"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastNotifier } from "@/components/layout/ToastNotifier";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileSidebarDrawer } from "@/components/layout/MobileSidebarDrawer";
import { Building2, Sparkles, Lock } from "lucide-react";
import LoginPage from "@/app/login/page";

const CreateTaskModal = dynamic(
  () => import("@/components/tasks/CreateTaskModal").then((mod) => mod.CreateTaskModal),
  { ssr: false }
);
const CreateProjectModal = dynamic(
  () => import("@/components/projects/CreateProjectModal").then((mod) => mod.CreateProjectModal),
  { ssr: false }
);
const UserManagementModal = dynamic(
  () => import("@/components/settings/UserManagementModal").then((mod) => mod.UserManagementModal),
  { ssr: false }
);
const LoginModal = dynamic(
  () => import("@/components/settings/LoginModal").then((mod) => mod.LoginModal),
  { ssr: false }
);
const ChangePasswordModal = dynamic(
  () => import("@/components/settings/ChangePasswordModal").then((mod) => mod.ChangePasswordModal),
  { ssr: false }
);
const WhatsAppChatWidget = dynamic(
  () => import("@/components/chat/WhatsAppChatWidget").then((mod) => mod.WhatsAppChatWidget),
  { ssr: false }
);
const MobilePwaPrompt = dynamic(
  () => import("@/components/mobile/MobilePwaPrompt").then((mod) => mod.MobilePwaPrompt),
  { ssr: false }
);
const TaskDrawer = dynamic(
  () => import("@/components/tasks/TaskDrawer").then((mod) => mod.TaskDrawer),
  { ssr: false }
);

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, brandSettings } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
          useAppStore.getState().syncUsersFromServer(data.users);
        }
      })
      .catch(() => {});
  }, []);

  // Authentication Guard: Redirect to /login if unauthenticated and on protected routes
  useEffect(() => {
    if (isHydrated && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, pathname, router]);

  // If on login page or not authenticated yet, render login screen directly
  if (pathname === "/login" || (!isAuthenticated && isHydrated)) {
    return <LoginPage />;
  }

  // Initial SSR / Hydration placeholder
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-xl animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-brand-400" />
          </div>
        </div>
      </div>
    );
  }

  // Render Full Protected Workspace
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased w-full">
      {/* Mobile PWA & Push Notification Banner */}
      <MobilePwaPrompt />

      {/* Toast Notification Alerts */}
      <ToastNotifier />

      {/* Team Chat Launcher & Drawer */}
      <WhatsAppChatWidget />

      {/* Collapsible Workspace Sidebar (Desktop) */}
      <Sidebar />

      {/* Mobile Slide-over Drawer (Android/Mobile) */}
      <MobileSidebarDrawer />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background/50 p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Android / Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Modals & Slide-over Drawer */}
      <TaskDrawer />
      <CreateTaskModal />
      <CreateProjectModal />
      <UserManagementModal />
      <LoginModal />
      <ChangePasswordModal />
    </div>
  );
};
