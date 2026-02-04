/**
 * Admin Store
 *
 * Manages admin dashboard state including:
 * - Dashboard statistics
 * - Moderation queue
 * - Event management
 * - User management
 * - System settings
 *
 * @module modules/admin/store
 * @version 1.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ==================== TYPES ====================

export type AdminTab = 'dashboard' | 'events' | 'marketplace' | 'users' | 'analytics' | 'settings';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ModerationItemType = 'listing' | 'transaction' | 'report' | 'user' | 'content';
export type ModerationStatus = 'pending' | 'reviewed' | 'escalated' | 'resolved' | 'dismissed';
export type EventStatus = 'active' | 'scheduled' | 'draft' | 'ended' | 'paused';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_review';

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

// ==================== INITIAL STATE ====================

const initialState: AdminState = {
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  isLoading: false,
  error: null,
  stats: null,
  statsLastUpdated: null,
  moderationQueue: [],
  moderationFilters: {
    status: 'all',
    riskLevel: 'all',
    type: 'all',
  },
  events: [],
  eventFilters: {
    status: 'all',
  },
  users: [],
  userFilters: {
    status: 'all',
    role: 'all',
  },
  selectedUserIds: [],
  systemSettings: [],
};

// ==================== STORE ====================

export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // UI Actions
        setActiveTab: (tab) => set({ activeTab: tab }),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setError: (error) => set({ error }),

        // Dashboard Actions
        fetchStats: async () => {
          set({ isLoading: true, error: null });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.get('/api/v1/admin/stats');
            set({
              stats: response.data as AdminStats,
              statsLastUpdated: new Date(),
              isLoading: false,
            });
          } catch (error) {
            // Use mock data for development
            set({
              stats: {
                activeUsers: 12847,
                activeEvents: 3,
                pendingModeration: 47,
                revenue24h: 284750,
                transactionsToday: 1893,
                disputeRate: 0.8,
                newUsersToday: 234,
                totalForums: 156,
                totalGroups: 89,
                serverLoad: 42,
              },
              statsLastUpdated: new Date(),
              isLoading: false,
            });
          }
        },

        refreshStats: async () => {
          await get().fetchStats();
        },

        // Moderation Actions
        fetchModerationQueue: async () => {
          set({ isLoading: true, error: null });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.get('/api/v1/admin/moderation');
            set({
              moderationQueue: (response.data as ModerationItem[]).map((item) => ({
                ...item,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
              })),
              isLoading: false,
            });
          } catch {
            // Use mock data for development
            set({
              moderationQueue: [
                {
                  id: '1',
                  type: 'listing',
                  status: 'pending',
                  riskLevel: 'high',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  summary: 'Suspicious pricing on rare item',
                  details: 'User listed a common item at 100x market price',
                  notes: [],
                },
                {
                  id: '2',
                  type: 'transaction',
                  status: 'escalated',
                  riskLevel: 'critical',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  summary: 'Potential fraud detection',
                  details: 'Multiple rapid transactions from same IP',
                  notes: ['Auto-flagged by system'],
                },
                {
                  id: '3',
                  type: 'report',
                  status: 'pending',
                  riskLevel: 'medium',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  summary: 'User report: harassment',
                  details: 'User reported receiving inappropriate messages',
                  reportedBy: 'user123',
                  notes: [],
                },
              ],
              isLoading: false,
            });
          }
        },

        setModerationFilters: (filters) =>
          set((state) => ({
            moderationFilters: { ...state.moderationFilters, ...filters },
          })),

        reviewModerationItem: async (id, action, notes) => {
          set({ isLoading: true });
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/moderation/${id}/review`, { action, notes });

            const newStatus: ModerationStatus =
              action === 'approve' ? 'resolved' : action === 'reject' ? 'dismissed' : 'escalated';

            set((state) => ({
              moderationQueue: state.moderationQueue.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: newStatus,
                      updatedAt: new Date(),
                      notes: notes ? [...item.notes, notes] : item.notes,
                    }
                  : item
              ),
              isLoading: false,
            }));
          } catch {
            set({ isLoading: false, error: 'Failed to review moderation item' });
          }
        },

        assignModerationItem: async (id, assigneeId) => {
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/moderation/${id}/assign`, { assignee_id: assigneeId });
            set((state) => ({
              moderationQueue: state.moderationQueue.map((item) =>
                item.id === id ? { ...item, assignedTo: assigneeId } : item
              ),
            }));
          } catch {
            set({ error: 'Failed to assign moderation item' });
          }
        },

        // Event Actions
        fetchEvents: async () => {
          set({ isLoading: true, error: null });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.get('/api/v1/admin/events');
            set({
              events: (response.data as AdminEvent[]).map((event) => ({
                ...event,
                startDate: new Date(event.startDate),
                endDate: new Date(event.endDate),
                createdAt: new Date(event.createdAt),
                updatedAt: new Date(event.updatedAt),
              })),
              isLoading: false,
            });
          } catch {
            // Use mock data for development
            set({
              events: [
                {
                  id: '1',
                  name: 'Winter Wonderland 2026',
                  description: 'Annual winter celebration event',
                  status: 'active',
                  participants: 4521,
                  startDate: new Date('2026-01-15'),
                  endDate: new Date('2026-02-15'),
                  rewards: [
                    { id: 'r1', type: 'xp', value: 500, condition: 'Participate in event' },
                    {
                      id: 'r2',
                      type: 'badge',
                      value: 'winter_hero',
                      condition: 'Complete all challenges',
                    },
                  ],
                  createdBy: 'admin',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                {
                  id: '2',
                  name: "Valentine's Day Special",
                  description: 'Love is in the air',
                  status: 'scheduled',
                  participants: 0,
                  startDate: new Date('2026-02-10'),
                  endDate: new Date('2026-02-16'),
                  rewards: [],
                  createdBy: 'admin',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
              isLoading: false,
            });
          }
        },

        setEventFilters: (filters) =>
          set((state) => ({
            eventFilters: { ...state.eventFilters, ...filters },
          })),

        createEvent: async (event) => {
          set({ isLoading: true });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.post('/api/v1/admin/events', event);
            const newEvent = response.data as AdminEvent;
            set((state) => ({
              events: [
                ...state.events,
                {
                  ...newEvent,
                  startDate: new Date(newEvent.startDate),
                  endDate: new Date(newEvent.endDate),
                  createdAt: new Date(newEvent.createdAt),
                  updatedAt: new Date(newEvent.updatedAt),
                },
              ],
              isLoading: false,
            }));
          } catch {
            // Create locally for development
            const now = new Date();
            set((state) => ({
              events: [
                ...state.events,
                {
                  ...event,
                  id: `event_${Date.now()}`,
                  createdAt: now,
                  updatedAt: now,
                } as AdminEvent,
              ],
              isLoading: false,
            }));
          }
        },

        updateEvent: async (id, updates) => {
          set({ isLoading: true });
          try {
            const { api } = await import('@/lib/api');
            await api.patch(`/api/v1/admin/events/${id}`, updates);
            set((state) => ({
              events: state.events.map((event) =>
                event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
              ),
              isLoading: false,
            }));
          } catch {
            set({ isLoading: false, error: 'Failed to update event' });
          }
        },

        deleteEvent: async (id) => {
          set({ isLoading: true });
          try {
            const { api } = await import('@/lib/api');
            await api.delete(`/api/v1/admin/events/${id}`);
            set((state) => ({
              events: state.events.filter((event) => event.id !== id),
              isLoading: false,
            }));
          } catch {
            set({ isLoading: false, error: 'Failed to delete event' });
          }
        },

        changeEventStatus: async (id, status) => {
          await get().updateEvent(id, { status });
        },

        // User Actions
        fetchUsers: async (_page = 1, _limit = 50) => {
          set({ isLoading: true, error: null });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.get('/api/v1/admin/users', {
              params: { page: _page, limit: _limit },
            });
            set({
              users: (response.data as AdminUser[]).map((user) => ({
                ...user,
                createdAt: new Date(user.createdAt),
                lastActive: new Date(user.lastActive),
              })),
              isLoading: false,
            });
          } catch {
            // Use mock data for development
            set({
              users: [
                {
                  id: '1',
                  username: 'power_user',
                  email: 'power@example.com',
                  status: 'active',
                  role: 'user',
                  createdAt: new Date('2025-06-15'),
                  lastActive: new Date(),
                  warningCount: 0,
                  xp: 15000,
                  level: 42,
                },
                {
                  id: '2',
                  username: 'troublemaker',
                  email: 'trouble@example.com',
                  status: 'suspended',
                  role: 'user',
                  createdAt: new Date('2025-10-20'),
                  lastActive: new Date('2026-01-30'),
                  warningCount: 3,
                  xp: 2500,
                  level: 8,
                },
                {
                  id: '3',
                  username: 'mod_helper',
                  email: 'mod@example.com',
                  status: 'active',
                  role: 'moderator',
                  createdAt: new Date('2025-03-10'),
                  lastActive: new Date(),
                  warningCount: 0,
                  xp: 45000,
                  level: 67,
                },
              ],
              isLoading: false,
            });
          }
        },

        setUserFilters: (filters) =>
          set((state) => ({
            userFilters: { ...state.userFilters, ...filters },
          })),

        selectUser: (id) =>
          set((state) => ({
            selectedUserIds: state.selectedUserIds.includes(id)
              ? state.selectedUserIds
              : [...state.selectedUserIds, id],
          })),

        deselectUser: (id) =>
          set((state) => ({
            selectedUserIds: state.selectedUserIds.filter((uid) => uid !== id),
          })),

        selectAllUsers: () =>
          set((state) => ({
            selectedUserIds: state.users.map((user) => user.id),
          })),

        clearUserSelection: () => set({ selectedUserIds: [] }),

        banUser: async (id, reason, duration) => {
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/users/${id}/ban`, { reason, duration });
            set((state) => ({
              users: state.users.map((user) =>
                user.id === id ? { ...user, status: 'banned' as UserStatus } : user
              ),
            }));
          } catch {
            set({ error: 'Failed to ban user' });
          }
        },

        suspendUser: async (id, reason, duration) => {
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/users/${id}/suspend`, { reason, duration });
            set((state) => ({
              users: state.users.map((user) =>
                user.id === id ? { ...user, status: 'suspended' as UserStatus } : user
              ),
            }));
          } catch {
            set({ error: 'Failed to suspend user' });
          }
        },

        warnUser: async (id, reason) => {
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/users/${id}/warn`, { reason });
            set((state) => ({
              users: state.users.map((user) =>
                user.id === id ? { ...user, warningCount: user.warningCount + 1 } : user
              ),
            }));
          } catch {
            set({ error: 'Failed to warn user' });
          }
        },

        unbanUser: async (id) => {
          try {
            const { api } = await import('@/lib/api');
            await api.post(`/api/v1/admin/users/${id}/unban`);
            set((state) => ({
              users: state.users.map((user) =>
                user.id === id ? { ...user, status: 'active' as UserStatus } : user
              ),
            }));
          } catch {
            set({ error: 'Failed to unban user' });
          }
        },

        changeUserRole: async (id, role) => {
          try {
            const { api } = await import('@/lib/api');
            await api.patch(`/api/v1/admin/users/${id}/role`, { role });
            set((state) => ({
              users: state.users.map((user) => (user.id === id ? { ...user, role } : user)),
            }));
          } catch {
            set({ error: 'Failed to change user role' });
          }
        },

        // Settings Actions
        fetchSettings: async () => {
          set({ isLoading: true, error: null });
          try {
            const { api } = await import('@/lib/api');
            const response = await api.get('/api/v1/admin/settings');
            set({ systemSettings: response.data as SystemSetting[], isLoading: false });
          } catch {
            // Use mock data for development
            set({
              systemSettings: [
                {
                  key: 'max_file_upload_size',
                  value: 10485760,
                  type: 'number',
                  category: 'uploads',
                  description: 'Maximum file upload size in bytes',
                  isEditable: true,
                },
                {
                  key: 'maintenance_mode',
                  value: false,
                  type: 'boolean',
                  category: 'system',
                  description: 'Enable maintenance mode',
                  isEditable: true,
                },
                {
                  key: 'registration_enabled',
                  value: true,
                  type: 'boolean',
                  category: 'auth',
                  description: 'Allow new user registrations',
                  isEditable: true,
                },
                {
                  key: 'rate_limit_requests',
                  value: 100,
                  type: 'number',
                  category: 'security',
                  description: 'Rate limit requests per minute',
                  isEditable: true,
                },
              ],
              isLoading: false,
            });
          }
        },

        updateSetting: async (key, value) => {
          try {
            const { api } = await import('@/lib/api');
            await api.patch(`/api/v1/admin/settings/${key}`, { value });
            set((state) => ({
              systemSettings: state.systemSettings.map((setting) =>
                setting.key === key ? { ...setting, value } : setting
              ),
            }));
          } catch {
            set({ error: 'Failed to update setting' });
          }
        },

        // Batch Actions
        batchAction: async (action, userIds, params) => {
          set({ isLoading: true });
          try {
            const { api } = await import('@/lib/api');
            await api.post('/api/v1/admin/batch', { action, user_ids: userIds, ...params });

            // Refresh users after batch action
            await get().fetchUsers();
            set({ selectedUserIds: [], isLoading: false });
          } catch {
            set({ isLoading: false, error: `Failed to execute batch ${action}` });
          }
        },
      }),
      {
        name: 'admin-store',
        partialize: (state) => ({
          activeTab: state.activeTab,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'AdminStore' }
  )
);

export default useAdminStore;
