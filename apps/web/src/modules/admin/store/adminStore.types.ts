/**
 * Admin Store Types
 *
 * All type aliases, interfaces, and state/action interfaces
 * for the admin store module.
 *
 * @module modules/admin/store/types
 * @version 1.0.0
 */

// ==================== TYPE ALIASES ====================

export type AdminTab = 'dashboard' | 'events' | 'marketplace' | 'users' | 'analytics' | 'settings';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ModerationItemType = 'listing' | 'transaction' | 'report' | 'user' | 'content';
export type ModerationStatus = 'pending' | 'reviewed' | 'escalated' | 'resolved' | 'dismissed';
export type EventStatus = 'active' | 'scheduled' | 'draft' | 'ended' | 'paused';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_review';

// ==================== INTERFACES ====================

export interface AdminStats {
  activeUsers: number;
  activeEvents: number;
  pendingModeration: number;
  revenue24h: number;
  transactionsToday: number;
  disputeRate: number;
  newUsersToday: number;
  totalForums: number;
  totalGroups: number;
  serverLoad: number;
}

export interface ModerationItem {
  id: string;
  type: ModerationItemType;
  status: ModerationStatus;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
  summary: string;
  details: string;
  reportedBy?: string;
  targetId?: string;
  targetType?: string;
  assignedTo?: string;
  notes: string[];
}

export interface AdminEvent {
  id: string;
  name: string;
  description: string;
  status: EventStatus;
  participants: number;
  startDate: Date;
  endDate: Date;
  rewards: EventReward[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventReward {
  id: string;
  type: 'xp' | 'badge' | 'item' | 'currency';
  value: number | string;
  condition: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  createdAt: Date;
  lastActive: Date;
  warningCount: number;
  xp: number;
  level: number;
}

export interface SystemSetting {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string;
  isEditable: boolean;
}

export interface AdminState {
  // UI State
  activeTab: AdminTab;
  sidebarCollapsed: boolean;
  isLoading: boolean;
  error: string | null;

  // Dashboard Data
  stats: AdminStats | null;
  statsLastUpdated: Date | null;

  // Moderation
  moderationQueue: ModerationItem[];
  moderationFilters: {
    status: ModerationStatus | 'all';
    riskLevel: RiskLevel | 'all';
    type: ModerationItemType | 'all';
  };

  // Events
  events: AdminEvent[];
  eventFilters: {
    status: EventStatus | 'all';
  };

  // Users
  users: AdminUser[];
  userFilters: {
    status: UserStatus | 'all';
    role: string | 'all';
  };
  selectedUserIds: string[];

  // Settings
  systemSettings: SystemSetting[];
}

export interface AdminActions {
  // UI Actions
  setActiveTab: (tab: AdminTab) => void;
  toggleSidebar: () => void;
  setError: (error: string | null) => void;

  // Dashboard Actions
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Moderation Actions
  fetchModerationQueue: () => Promise<void>;
  setModerationFilters: (filters: Partial<AdminState['moderationFilters']>) => void;
  reviewModerationItem: (
    id: string,
    action: 'approve' | 'reject' | 'escalate',
    notes?: string
  ) => Promise<void>;
  assignModerationItem: (id: string, assigneeId: string) => Promise<void>;

  // Event Actions
  fetchEvents: () => Promise<void>;
  setEventFilters: (filters: Partial<AdminState['eventFilters']>) => void;
  createEvent: (event: Omit<AdminEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<AdminEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  changeEventStatus: (id: string, status: EventStatus) => Promise<void>;

  // User Actions
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  setUserFilters: (filters: Partial<AdminState['userFilters']>) => void;
  selectUser: (id: string) => void;
  deselectUser: (id: string) => void;
  selectAllUsers: () => void;
  clearUserSelection: () => void;
  banUser: (id: string, reason: string, duration?: number) => Promise<void>;
  suspendUser: (id: string, reason: string, duration: number) => Promise<void>;
  warnUser: (id: string, reason: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  changeUserRole: (id: string, role: AdminUser['role']) => Promise<void>;

  // Settings Actions
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: SystemSetting['value']) => Promise<void>;

  // Batch Actions
  batchAction: (
    action: string,
    userIds: string[],
    params?: Record<string, unknown>
  ) => Promise<void>;
}

export type AdminStore = AdminState & AdminActions;
