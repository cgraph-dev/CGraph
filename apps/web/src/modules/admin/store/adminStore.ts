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

import type {
  AdminStats,
  AdminEvent,
  AdminUser,
  AdminState,
  AdminStore,
  ModerationItem,
  ModerationStatus,
  SystemSetting,
  UserStatus,
} from './adminStore.types';
import {
  MOCK_ADMIN_STATS,
  MOCK_MODERATION_QUEUE,
  MOCK_ADMIN_EVENTS,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_SETTINGS,
} from './adminStore.mockData';

export * from './adminStore.types';

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
              stats: MOCK_ADMIN_STATS,
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
              moderationQueue: MOCK_MODERATION_QUEUE,
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
              events: MOCK_ADMIN_EVENTS,
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
              users: MOCK_ADMIN_USERS,
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
              systemSettings: MOCK_ADMIN_SETTINGS,
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
