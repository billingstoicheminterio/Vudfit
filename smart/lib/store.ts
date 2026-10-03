import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Workspace,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  Subtask,
  TaskComment,
  CRMDeal,
  CRMStage,
  TimeEntry,
  User,
  BrandSettings,
  AppNotification,
  ChatMessage,
  ChatChannel,
  AttendanceRecord,
  AttendanceStatus,
} from "./types";
import {
  MOCK_WORKSPACES,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_DEALS,
  MOCK_TIME_ENTRIES,
  MOCK_USERS,
  MOCK_CHANNELS,
  MOCK_CHAT_MESSAGES,
  MOCK_ATTENDANCE,
} from "./mockData";
import { triggerNativePushNotification } from "./pushNotificationService";

interface ActiveTimer {
  taskId: string;
  taskTitle: string;
  projectName: string;
  startTime: number;
  secondsElapsed: number;
  isRunning: boolean;
}

interface AppState {
  theme: "dark" | "light";
  workspaces: Workspace[];
  activeWorkspaceId: string;
  projects: Project[];
  activeProjectId: string | null;
  tasks: Task[];
  activeTaskId: string | null;
  deals: CRMDeal[];
  timeEntries: TimeEntry[];
  attendanceRecords: AttendanceRecord[];
  todayPunchRecord: {
    punchInTime: string | null;
    isPunchedIn: boolean;
    isOnBreak: boolean;
    breakStartTimeTimestamp: number | null;
    totalBreakSeconds: number;
    startTimeTimestamp: number | null;
    location?: string;
  };
  users: User[];
  currentUser: User;
  searchQuery: string;

  // Active Timer
  activeTimer: ActiveTimer | null;

  // Modals & Panels
  isCreateTaskOpen: boolean;
  isCreateProjectOpen: boolean;
  isCreateDealOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  // Brand & Theme Customization
  brandSettings: BrandSettings;
  isBrandSettingsOpen: boolean;
  setBrandSettingsOpen: (open: boolean) => void;
  updateBrandSettings: (settings: Partial<BrandSettings>) => void;

  // User Management & Login Controls
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  isUserManagementOpen: boolean;
  isLoginModalOpen: boolean;
  isChangePasswordOpen: boolean;
  setUserManagementOpen: (open: boolean) => void;
  setLoginModalOpen: (open: boolean) => void;
  setChangePasswordOpen: (open: boolean) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (user: User) => void;

  // Task User Filtering
  taskFilterUser: string; // 'all' | 'my_tasks' | userId
  setTaskFilterUser: (filter: string) => void;

  // Notifications State & Actions
  notifications: AppNotification[];
  activeToast: AppNotification | null;
  addNotification: (notif: Omit<AppNotification, "id" | "isRead" | "createdAt">) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  dismissToast: () => void;

  // Team Chat State & Actions
  isChatOpen: boolean;
  activeChatUserId: string | null;
  activeChannelId: string | null;
  chatMessages: ChatMessage[];
  chatChannels: ChatChannel[];
  setChatOpen: (open: boolean) => void;
  setActiveChatUser: (userId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  sendChatMessage: (data: { receiverId?: string; channelId?: string; content: string; imageUrl?: string }) => void;
  markMessagesAsRead: (partnerId?: string, channelId?: string) => void;
  syncChatMessages: (messages: ChatMessage[]) => void;
  syncUsersFromServer: (serverUsers: User[]) => void;

  // Actions
  toggleTheme: () => void;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  setActiveTask: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  setCreateTaskOpen: (open: boolean) => void;
  setCreateProjectOpen: (open: boolean) => void;
  setCreateDealOpen: (open: boolean) => void;

  // Project CRUD
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task CRUD & Drag & Drop
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "subtasks" | "comments">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  deleteTask: (id: string) => void;
  reorderTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;

  // Subtasks & Comments
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;

  // Timer Actions
  startTimer: (taskId: string, taskTitle: string, projectName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: (description?: string) => void;
  tickTimer: () => void;

  // CRM Actions
  addDeal: (deal: Omit<CRMDeal, "id" | "createdAt">) => void;
  updateDealStage: (id: string, stage: CRMStage) => void;
  deleteDeal: (id: string) => void;

  // Attendance Actions
  punchIn: (location?: string) => void;
  punchOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  markStaffGateEntry: (data: {
    userId: string;
    type: "in" | "out" | "break_start" | "break_end";
    customTime?: string;
    location?: string;
    notes?: string;
  }) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, "id">) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "light",
  workspaces: MOCK_WORKSPACES,
  activeWorkspaceId: MOCK_WORKSPACES[0].id,
  projects: MOCK_PROJECTS,
  activeProjectId: MOCK_PROJECTS[0].id,
  tasks: MOCK_TASKS,
  activeTaskId: null,
  deals: MOCK_DEALS,
  timeEntries: MOCK_TIME_ENTRIES,
  attendanceRecords: MOCK_ATTENDANCE,
  todayPunchRecord: {
    punchInTime: "09:30 AM",
    isPunchedIn: true,
    isOnBreak: false,
    breakStartTimeTimestamp: null,
    totalBreakSeconds: 45 * 60, // 45 mins break taken
    startTimeTimestamp: Date.now() - 3.5 * 3600 * 1000,
    location: "Head Office (VUDFIT)",
  },
  users: MOCK_USERS,
  currentUser: MOCK_USERS[0],
  isAuthenticated: false,
  searchQuery: "",
  taskFilterUser: "all",
  setTaskFilterUser: (filter) => set({ taskFilterUser: filter }),
  notifications: [
    {
      id: "notif-1",
      title: "Task Assigned 🔔",
      message: "Italian Acrylic Modular Kitchen & Bedroom Wardrobes assigned to you.",
      type: "task_assigned",
      taskId: "task-1",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ],
  activeToast: null,
  isChatOpen: false,
  activeChatUserId: null,
  activeChannelId: null,
  chatMessages: MOCK_CHAT_MESSAGES,
  chatChannels: MOCK_CHANNELS,

  setChatOpen: (open) => set({ isChatOpen: open }),
  setActiveChatUser: (userId) => set({ activeChatUserId: userId, activeChannelId: null }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId, activeChatUserId: null }),
  sendChatMessage: ({ receiverId, channelId, content, imageUrl }) => {
    const sender = get().currentUser;
    const receiver = receiverId ? get().users.find((u) => u.id === receiverId) : undefined;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderEmail: sender.email,
      receiverId,
      receiverEmail: receiver?.email,
      channelId,
      content: content.trim(),
      imageUrl,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));

    // Real-time broadcast to local LAN server
    if (typeof window !== "undefined") {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      }).catch((err) => console.error("Error broadcasting chat to LAN server:", err));
    }
  },
  markMessagesAsRead: (partnerId?: string, channelId?: string) => {
    const currentUser = get().currentUser;
    const partner = partnerId ? get().users.find((u) => u.id === partnerId) : undefined;

    set((state) => {
      const updated = state.chatMessages.map((m) => {
        const isTargetDirect =
          partnerId &&
          (m.receiverId === currentUser.id || (currentUser.email && m.receiverEmail?.toLowerCase() === currentUser.email.toLowerCase())) &&
          (m.senderId === partnerId || (partner?.email && m.senderEmail?.toLowerCase() === partner.email.toLowerCase()));

        const isTargetChannel = channelId && m.channelId === channelId;

        if ((isTargetDirect || isTargetChannel) && !m.isRead) {
          return { ...m, isRead: true };
        }
        return m;
      });
      return { chatMessages: updated };
    });

    if (typeof window !== "undefined") {
      fetch("/api/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          partnerId,
          partnerEmail: partner?.email,
          channelId,
        }),
      }).catch((err) => console.error("Error marking messages as read on server:", err));
    }
  },
  syncChatMessages: (messages: ChatMessage[]) => {
    set((state) => {
      // Merge unique messages by id
      const msgMap = new Map<string, ChatMessage>();
      state.chatMessages.forEach((m) => {
        if (m && m.id) msgMap.set(m.id, m);
      });
      messages.forEach((m) => {
        if (m && m.id) msgMap.set(m.id, m);
      });
      const sorted = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return { chatMessages: sorted };
    });
  },
  syncUsersFromServer: (serverUsers: User[]) => {
    if (!Array.isArray(serverUsers) || serverUsers.length === 0) return;
    set((state) => {
      const curr =
        serverUsers.find(
          (u) => u.id === state.currentUser.id || (u.email && u.email.toLowerCase() === state.currentUser.email.toLowerCase())
        ) ||
        serverUsers[0] ||
        state.currentUser;
      return { users: serverUsers, currentUser: curr };
    });
  },
  activeTimer: null,
  isCreateTaskOpen: false,
  isCreateProjectOpen: false,
  isCreateDealOpen: false,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  brandSettings: {
    brandName: "VUDFIT",
    brandTagline: "Style • Strength • Luxury - By Stoichem Interio Pvt.Ltd.",
    logoType: "image",
    logoIcon: "Sparkles",
    logoImageUrl: "/vudfit-logo.png",
    colorTheme: "vudfit_gold",
  },
  isBrandSettingsOpen: false,
  isUserManagementOpen: false,
  isLoginModalOpen: false,
  isChangePasswordOpen: false,

  setUserManagementOpen: (open) => set({ isUserManagementOpen: open }),
  setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
  setChangePasswordOpen: (open) => set({ isChangePasswordOpen: open }),

  setBrandSettingsOpen: (open) => set({ isBrandSettingsOpen: open }),
  updateBrandSettings: (settings) => {
    const updated = { ...get().brandSettings, ...settings };
    if (typeof document !== "undefined" && settings.colorTheme) {
      document.documentElement.setAttribute("data-color-theme", settings.colorTheme);
    }
    set({ brandSettings: updated });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme: nextTheme });
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, activeProjectId: null }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveTask: (id) => set({ activeTaskId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setCreateTaskOpen: (open) => set({ isCreateTaskOpen: open }),
  setCreateProjectOpen: (open) => set({ isCreateProjectOpen: open }),
  setCreateDealOpen: (open) => set({ isCreateDealOpen: open }),

  // Projects
  addProject: (projectData) => {
    const newProj: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      projects: [newProj, ...state.projects],
      activeProjectId: newProj.id,
    }));
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }));
  },

  // Tasks
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      subtasks: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: "New Task Assigned 🔔",
      message: `Task "${newTask.title}" has been assigned.`,
      type: "task_assigned",
      taskId: newTask.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      notifications: [notif, ...state.notifications],
      activeToast: notif,
    }));

    triggerNativePushNotification(notif.title, notif.message);
  },

  updateTask: (id, updates) => {
    const existingTask = get().tasks.find((t) => t.id === id);
    const isReassigned = updates.assignedTo && existingTask;

    set((state) => {
      const updatedTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );

      let newNotifs = state.notifications;
      let newToast = state.activeToast;

      if (isReassigned) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}`,
          title: "Task Reassigned 🔄",
          message: `Task "${existingTask.title}" transferred to new user.`,
          type: "task_assigned",
          taskId: id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        newNotifs = [notif, ...state.notifications];
        newToast = notif;
        triggerNativePushNotification(notif.title, notif.message);
      }

      return {
        tasks: updatedTasks,
        notifications: newNotifs,
        activeToast: newToast,
      };
    });
  },

  updateTaskStatus: (id, status) => {
    const user = get().currentUser;
    const isClosing = status === "done" || status === "completed";
    if (isClosing && user.role !== "admin" && user.role !== "director" && user.role !== "manager") {
      get().addNotification({
        title: "Action Restricted ⚠️",
        message: "Team members cannot complete tasks. Please use 'Transfer Department' to transfer the task to another person.",
        type: "general",
      });
      return;
    }

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },

  updateTaskPriority: (id, priority) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, priority, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },

  deleteTask: (id) => {
    const user = get().currentUser;
    const canDelete = user.role === "admin" || user.role === "director" || user.role === "manager";
    if (!canDelete) {
      alert("Permission Denied: Only Admin, Director, and Manager can delete tasks.");
      return;
    }
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
    }));
  },

  reorderTask: (taskId, newStatus, newIndex) => {
    const user = get().currentUser;
    const isClosing = newStatus === "done" || newStatus === "completed";
    if (isClosing && user.role !== "admin" && user.role !== "director" && user.role !== "manager") {
      get().addNotification({
        title: "Action Restricted ⚠️",
        message: "Team members cannot mark tasks as Done. You can only transfer/handoff tasks.",
        type: "general",
      });
      return;
    }

    set((state) => {
      const targetTask = state.tasks.find((t) => t.id === taskId);
      if (!targetTask) return state;

      const projectId = targetTask.projectId;

      // Project tasks vs other project tasks
      const projectTasks = state.tasks.filter((t) => t.projectId === projectId);
      const otherProjectTasks = state.tasks.filter((t) => t.projectId !== projectId);

      // Tasks in destination column (excluding the moved task)
      const destTasks = projectTasks
        .filter((t) => t.status === newStatus && t.id !== taskId)
        .sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0));

      // Tasks in other statuses of this project
      const otherStatusTasks = projectTasks.filter(
        (t) => t.status !== newStatus && t.id !== taskId
      );

      // Updated moved task
      const updatedMovedTask: Task = {
        ...targetTask,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      // Insert at bounded newIndex in destination list
      const newDestList = [...destTasks];
      const boundedIndex = Math.max(0, Math.min(newIndex, newDestList.length));
      newDestList.splice(boundedIndex, 0, updatedMovedTask);

      // Sequential position indexing
      const indexedDestTasks = newDestList.map((t, idx) => ({
        ...t,
        positionIndex: idx,
      }));

      // Combine all tasks cleanly
      const combined = [
        ...otherProjectTasks,
        ...otherStatusTasks,
        ...indexedDestTasks,
      ];

      return { tasks: combined };
    });
  },

  // Subtasks & Comments
  addSubtask: (taskId, title) => {
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      taskId,
      title,
      isCompleted: false,
    };
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, newSub], updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
              ),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  addComment: (taskId, content) => {
    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      taskId,
      userId: get().currentUser.id,
      user: get().currentUser,
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [newComment, ...(t.comments || [])] } : t
      ),
    }));
  },

  deleteComment: (taskId, commentId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: (t.comments || []).filter((c) => c.id !== commentId),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  // Timer
  startTimer: (taskId, taskTitle, projectName) => {
    set({
      activeTimer: {
        taskId,
        taskTitle,
        projectName,
        startTime: Date.now(),
        secondsElapsed: 0,
        isRunning: true,
      },
    });
  },

  pauseTimer: () => {
    set((state) => (state.activeTimer ? { activeTimer: { ...state.activeTimer, isRunning: false } } : state));
  },

  resumeTimer: () => {
    set((state) => (state.activeTimer ? { activeTimer: { ...state.activeTimer, isRunning: true } } : state));
  },

  tickTimer: () => {
    set((state) => {
      if (!state.activeTimer || !state.activeTimer.isRunning) return state;
      return {
        activeTimer: {
          ...state.activeTimer,
          secondsElapsed: state.activeTimer.secondsElapsed + 1,
        },
      };
    });
  },

  stopAndSaveTimer: (description) => {
    const timer = get().activeTimer;
    if (!timer) return;

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      taskId: timer.taskId,
      taskTitle: timer.taskTitle,
      projectName: timer.projectName,
      userId: get().currentUser.id,
      user: get().currentUser,
      description: description || "Task work log",
      durationSeconds: timer.secondsElapsed,
      startTime: new Date(timer.startTime).toISOString(),
      endTime: new Date().toISOString(),
      isBillable: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      timeEntries: [newEntry, ...state.timeEntries],
      activeTimer: null,
    }));
  },

  // CRM Deals
  addDeal: (dealData) => {
    const newDeal: CRMDeal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ deals: [newDeal, ...state.deals] }));
  },

  updateDealStage: (id, stage) => {
    set((state) => ({
      deals: state.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
    }));
  },

  deleteDeal: (id) => {
    set((state) => ({
      deals: state.deals.filter((d) => d.id !== id),
    }));
  },

  // User Management Actions
  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      status: userData.status || "active",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    if (typeof window !== "undefined") {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      }).catch((err) => console.error("Error syncing new user to LAN server:", err));
    }
  },

  updateUser: (id, updates) => {
    set((state) => {
      const updatedUsers = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      const updatedCurrentUser = state.currentUser.id === id ? { ...state.currentUser, ...updates } : state.currentUser;
      return { users: updatedUsers, currentUser: updatedCurrentUser };
    });

    const fullUser = get().users.find((u) => u.id === id);
    if (typeof window !== "undefined" && fullUser) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullUser),
      }).catch((err) => console.error("Error persisting user updates to server:", err));
    }
  },

  deleteUser: (id) => {
    const target = get().users.find((u) => u.id === id);
    set((state) => {
      const filtered = state.users.filter((u) => u.id !== id);
      const nextCurrent = state.currentUser.id === id ? (filtered[0] || state.currentUser) : state.currentUser;
      return { users: filtered, currentUser: nextCurrent };
    });

    if (typeof window !== "undefined") {
      const query = target?.email ? `id=${encodeURIComponent(id)}&email=${encodeURIComponent(target.email)}` : `id=${encodeURIComponent(id)}`;
      fetch(`/api/users?${query}`, { method: "DELETE" })
        .catch((err) => console.error("Error deleting user on LAN server:", err));
    }
  },

  login: (user) => {
    set({ currentUser: user, isAuthenticated: true });
    get().addNotification({
      title: `Welcome, ${user.name}! 🌟`,
      message: `Signed in as ${user.role.replace("_", " ").toUpperCase()} (${user.department || "VUDFIT"}).`,
      type: "general",
    });
  },

  logout: () => {
    set({ isAuthenticated: false });
    get().addNotification({
      title: "Signed Out ⚪",
      message: "You have been logged out of the workspace.",
      type: "general",
    });
  },

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

  // Notification Actions
  addNotification: (notifData) => {
    const notif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [notif, ...state.notifications],
      activeToast: notif,
    }));
  },

  markNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),
  dismissToast: () => set({ activeToast: null }),

  // Attendance Actions Implementation
  punchIn: (location = "Head Office (VUDFIT)") => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toISOString().split("T")[0];
    const user = get().currentUser;

    set({
      todayPunchRecord: {
        punchInTime: timeStr,
        isPunchedIn: true,
        isOnBreak: false,
        breakStartTimeTimestamp: null,
        totalBreakSeconds: 0,
        startTimeTimestamp: Date.now(),
        location,
      },
    });

    // Check if record already exists for today
    const existing = get().attendanceRecords.find(
      (r) => r.userId === user.id && r.date === dateStr
    );

    if (!existing) {
      const newRecord: AttendanceRecord = {
        id: `att-${user.id}-${dateStr}`,
        userId: user.id,
        date: dateStr,
        punchIn: timeStr,
        totalHours: 0,
        status: "present",
        location,
        notes: "Punched In",
      };
      set((state) => ({ attendanceRecords: [newRecord, ...state.attendanceRecords] }));
    }

    get().addNotification({
      title: "Attendance Punched In 🟢",
      message: `You marked present at ${timeStr} (${location}). Have a productive workday!`,
      type: "general",
    });
  },

  punchOut: () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toISOString().split("T")[0];
    const user = get().currentUser;
    const punchRecord = get().todayPunchRecord;

    const hoursWorked = punchRecord.startTimeTimestamp
      ? Math.max(0.1, Number(((Date.now() - punchRecord.startTimeTimestamp) / 3600000).toFixed(2)))
      : 8.5;

    set({
      todayPunchRecord: {
        punchInTime: punchRecord.punchInTime,
        isPunchedIn: false,
        isOnBreak: false,
        breakStartTimeTimestamp: null,
        totalBreakSeconds: punchRecord.totalBreakSeconds || 0,
        startTimeTimestamp: null,
        location: punchRecord.location,
      },
    });

    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) => {
        if (r.userId === user.id && r.date === dateStr) {
          return {
            ...r,
            punchOut: timeStr,
            totalHours: hoursWorked,
            notes: `Workday Completed (${hoursWorked} hrs)`,
          };
        }
        return r;
      }),
    }));

    get().addNotification({
      title: "Attendance Punched Out ⚪",
      message: `You clocked out at ${timeStr}. Total time logged today: ${hoursWorked} hrs.`,
      type: "general",
    });
  },

  startBreak: () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    set((state) => ({
      todayPunchRecord: {
        ...state.todayPunchRecord,
        isOnBreak: true,
        breakStartTimeTimestamp: Date.now(),
      },
    }));

    get().addNotification({
      title: "Break Started ☕",
      message: `You are now on break (started at ${timeStr}). Enjoy your lunch / tea break!`,
      type: "general",
    });
  },

  endBreak: () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const punch = get().todayPunchRecord;
    const additionalBreakSeconds = punch.breakStartTimeTimestamp
      ? Math.floor((Date.now() - punch.breakStartTimeTimestamp) / 1000)
      : 0;

    const totalBreakSecs = punch.totalBreakSeconds + additionalBreakSeconds;
    const totalBreakMinutes = Math.round(totalBreakSecs / 60);
    const dateStr = new Date().toISOString().split("T")[0];
    const user = get().currentUser;

    set({
      todayPunchRecord: {
        ...punch,
        isOnBreak: false,
        breakStartTimeTimestamp: null,
        totalBreakSeconds: totalBreakSecs,
      },
    });

    // Update breakMinutes on today's attendance record
    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) => {
        if (r.userId === user.id && r.date === dateStr) {
          return {
            ...r,
            breakMinutes: totalBreakMinutes,
          };
        }
        return r;
      }),
    }));

    get().addNotification({
      title: "Break Ended ▶️",
      message: `Break resumed at ${timeStr}. Total break logged today: ${totalBreakMinutes} mins.`,
      type: "general",
    });
  },

  markStaffGateEntry: ({ userId, type, customTime, location = "Main Gate (VUDFIT)", notes }) => {
    const now = new Date();
    const timeStr = customTime || now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toISOString().split("T")[0];
    const targetUser = get().users.find((u) => u.id === userId);
    const targetUserName = targetUser?.name || "Staff Member";

    const existing = get().attendanceRecords.find(
      (r) => r.userId === userId && r.date === dateStr
    );

    if (type === "in") {
      if (existing) {
        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((r) =>
            r.userId === userId && r.date === dateStr
              ? { ...r, punchIn: timeStr, status: "present", location, notes: notes || r.notes || "Gate In Marked" }
              : r
          ),
        }));
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${userId}-${dateStr}`,
          userId,
          date: dateStr,
          punchIn: timeStr,
          totalHours: 0,
          status: "present",
          location,
          notes: notes || "Gate Entry Marked by Security",
        };
        set((state) => ({ attendanceRecords: [newRec, ...state.attendanceRecords] }));
      }

      get().addNotification({
        title: "Gate Entry Marked 🟢",
        message: `${targetUserName} entered at ${timeStr} (${location}).`,
        type: "general",
      });
    } else if (type === "out") {
      if (existing) {
        // Calculate rough working hours
        let calculatedHours = 8.5;
        if (existing.punchIn && existing.punchIn !== "-") {
          try {
            const [inH, inM] = existing.punchIn.split(" ")[0].split(":").map(Number);
            const inIsPM = existing.punchIn.includes("PM") && inH !== 12;
            const inHour24 = inIsPM ? inH + 12 : inH;

            const [outH, outM] = timeStr.split(" ")[0].split(":").map(Number);
            const outIsPM = timeStr.includes("PM") && outH !== 12;
            const outHour24 = outIsPM ? outH + 12 : outH;

            const diffMinutes = (outHour24 * 60 + outM) - (inHour24 * 60 + inM);
            const breakM = existing.breakMinutes || 0;
            calculatedHours = Math.max(0.1, Number(((diffMinutes - breakM) / 60).toFixed(2)));
          } catch {
            calculatedHours = 8.5;
          }
        }

        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((r) =>
            r.userId === userId && r.date === dateStr
              ? { ...r, punchOut: timeStr, totalHours: calculatedHours, notes: notes || r.notes || "Gate Exit Marked" }
              : r
          ),
        }));
      } else {
        const newRec: AttendanceRecord = {
          id: `att-${userId}-${dateStr}`,
          userId,
          date: dateStr,
          punchIn: "09:30 AM",
          punchOut: timeStr,
          totalHours: 8.5,
          status: "present",
          location,
          notes: notes || "Gate Exit Marked by Security",
        };
        set((state) => ({ attendanceRecords: [newRec, ...state.attendanceRecords] }));
      }

      get().addNotification({
        title: "Gate Exit Marked 🔴",
        message: `${targetUserName} departed at ${timeStr} (${location}).`,
        type: "general",
      });
    } else if (type === "break_start") {
      set((state) => ({
        attendanceRecords: state.attendanceRecords.map((r) =>
          r.userId === userId && r.date === dateStr
            ? { ...r, notes: `On Lunch/Tea Break (since ${timeStr})` }
            : r
        ),
      }));
    } else if (type === "break_end") {
      set((state) => ({
        attendanceRecords: state.attendanceRecords.map((r) =>
          r.userId === userId && r.date === dateStr
            ? { ...r, breakMinutes: (r.breakMinutes || 0) + 30, notes: "Break Completed" }
            : r
        ),
      }));
    }
  },

  addAttendanceRecord: (recordData) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${recordData.userId}-${recordData.date}`,
    };
    set((state) => ({
      attendanceRecords: [
        newRecord,
        ...state.attendanceRecords.filter((r) => !(r.userId === recordData.userId && r.date === recordData.date)),
      ],
    }));
  },
    }),
    {
      name: "vudfit-smarttask-storage-v3",
      merge: (persistedState: any, currentState) => {
        const projectOrder = ["proj-1", "proj-2", "proj-3", "proj-5", "proj-4"];
        const mergedProjects = [...currentState.projects];
        if (persistedState?.projects && Array.isArray(persistedState.projects)) {
          persistedState.projects.forEach((p: any) => {
            if (!mergedProjects.some((mp) => mp.id === p.id)) {
              mergedProjects.push(p);
            }
          });
        }

        // Clean Production statuses (remove installation) and sort in requested sequence
        const cleanProjects = mergedProjects
          .map((p) => {
            if (p.id === "proj-3") {
              return {
                ...p,
                statuses: (p.statuses || []).filter((st: any) => st.id !== "installation"),
              };
            }
            return p;
          })
          .sort((a, b) => {
            const idxA = projectOrder.indexOf(a.id);
            const idxB = projectOrder.indexOf(b.id);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });

        // Deduplicate and sanitize tasks
        const rawTasks = [
          ...(Array.isArray(persistedState?.tasks) ? persistedState.tasks : []),
          ...currentState.tasks,
        ];
        const taskMap = new Map<string, Task>();
        if (Array.isArray(rawTasks)) {
          rawTasks.forEach((t: Task) => {
            if (t && t.id && !taskMap.has(t.id)) {
              const defaultTask = currentState.tasks.find((ct) => ct.id === t.id);
              const mergedTask: Task = {
                ...t,
                handoffHistory:
                  t.handoffHistory && t.handoffHistory.length > 0
                    ? t.handoffHistory
                    : defaultTask?.handoffHistory || [],
                comments:
                  t.comments && t.comments.length > 0
                    ? t.comments
                    : defaultTask?.comments || [],
              };
              taskMap.set(t.id, mergedTask);
            }
          });
        }
        const cleanTasks = Array.from(taskMap.values());

        // Keep persisted users if available, avoiding resurrection of deleted users
        const finalUsers =
          persistedState?.users && Array.isArray(persistedState.users) && persistedState.users.length > 0
            ? persistedState.users
            : currentState.users;

        // Admin account is only for management; tasks should only be assigned to operational team members
        const firstTeamMemberId =
          finalUsers.find(
            (u: User) => u.role !== "admin" && u.name?.toLowerCase() !== "admin" && u.id !== "user-admin"
          )?.id || "user-1788423783557";

        const sanitizedTasks = cleanTasks.map((t) => {
          const nonAdminAssignees = (t.assignedTo || []).filter(
            (id) => !finalUsers.some((u: User) => u.id === id && (u.role === "admin" || u.name?.toLowerCase() === "admin" || u.id === "user-admin"))
          );
          const isOldInstallationTask = t.projectId === "proj-3" && t.status === "installation";
          return {
            ...t,
            projectId: isOldInstallationTask ? "proj-5" : t.projectId,
            status: isOldInstallationTask ? "installation_progress" : t.status,
            assignedTo: nonAdminAssignees.length > 0 ? nonAdminAssignees : [firstTeamMemberId],
          };
        });

        return {
          ...currentState,
          ...persistedState,
          users: finalUsers,
          tasks: sanitizedTasks.length > 0 ? sanitizedTasks : currentState.tasks,
          attendanceRecords: persistedState?.attendanceRecords?.length ? persistedState.attendanceRecords : currentState.attendanceRecords,
          projects: cleanProjects.length > 0 ? cleanProjects : currentState.projects,
        };
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        users: state.users,
        currentUser: state.currentUser,
        brandSettings: state.brandSettings,
        theme: state.theme,
        projects: state.projects,
        tasks: state.tasks,
        deals: state.deals,
        timeEntries: state.timeEntries,
        attendanceRecords: state.attendanceRecords,
        todayPunchRecord: state.todayPunchRecord,
      }),
    }
  )
);
