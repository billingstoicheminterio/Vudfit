export type AppColorTheme = 'vudfit_green' | 'vudfit_gold' | 'vudfit_gold_bg' | 'vudfit_bronze' | 'indigo' | 'emerald' | 'sapphire' | 'amber' | 'violet' | 'rose' | 'cyan';

export interface BrandSettings {
  brandName: string;
  brandTagline?: string;
  logoType: 'icon' | 'image';
  logoIcon: string;
  logoImageUrl?: string;
  colorTheme: AppColorTheme;
}

export type UserRole = 'admin' | 'director' | 'manager' | 'team_leader' | 'team_member' | 'security';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = string;
export type CRMStage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface UserPermissions {
  canViewAllTasks: boolean;
  departmentAccess: 'all' | 'own_department_only';
  allowedDepartments?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  password?: string;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  permissions?: UserPermissions;
  createdAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  user: User;
  role: UserRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export interface ProjectSection {
  id: string;
  projectId: string;
  name: string;
  positionIndex: number;
}

export interface ProjectStatusOption {
  id: string;
  name: string;
  color?: string;
}

export type LeadSource = 'showroom' | 'digital' | 'reference' | 'architect';

export type WorkCategory = '2d' | 'site_image' | '3d_renders' | '360_image' | 'quotation' | 'presentation';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'jpg' | 'png' | 'cad' | 'doc';
  size: string;
  category?: WorkCategory;
  department?: string;
  uploaderId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface HandoffRecord {
  id: string;
  fromDept: string;
  toDept: string;
  fromUser: string;
  toUser: string;
  remark: string;
  timestamp: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'archived' | 'completed';
  startDate?: string;
  endDate?: string;
  sections: ProjectSection[];
  statuses: ProjectStatusOption[];
  customerName?: string;
  customerPhone?: string;
  siteAddress?: string;
  leadSource?: LeadSource;
  createdBy: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface CustomFieldValue {
  id: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'tag';
  value: string;
}

export interface Task {
  id: string;
  projectId: string;
  sectionId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  createdBy: string;
  assignedTo: string[]; // User IDs
  subtasks: Subtask[];
  comments: TaskComment[];
  customFields?: CustomFieldValue[];
  customerName?: string;
  customerPhone?: string;
  siteAddress?: string;
  leadSource?: LeadSource;
  attachments?: TaskAttachment[];
  handoffHistory?: HandoffRecord[];
  stickyColor?: 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'default';
  positionIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  userId: string;
  user: User;
  description?: string;
  durationSeconds: number;
  startTime: string;
  endTime?: string;
  isBillable: boolean;
  createdAt: string;
}

export interface CRMContact {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  notes?: string;
  createdAt: string;
}

export interface CRMDeal {
  id: string;
  workspaceId: string;
  contactId?: string;
  customerName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company: string;
  companyAddress?: string;
  title: string;
  stage: CRMStage;
  value: number;
  probability: number; // 0-100
  expectedCloseDate: string;
  assignedTo: string; // User ID
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_handoff' | 'status_change' | 'general';
  taskId?: string;
  userId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderEmail?: string;
  receiverId?: string;
  receiverEmail?: string;
  channelId?: string;
  content: string;
  imageUrl?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  isGroup: boolean;
  icon?: string;
}

export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'leave' | 'holiday' | 'weekly_off';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  punchIn: string; // e.g. "09:30 AM" or ISO
  punchOut?: string; // e.g. "06:45 PM"
  breakMinutes?: number; // e.g. 45 or 60 (Break Duration in minutes)
  totalHours: number; // e.g. 8.5 (Effective worked hours)
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

