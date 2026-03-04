/**
 * Admin User Actions
 *
 * User fetch, filter, selection, moderation (ban/suspend/warn/unban),
 * role changes, and batch actions.
 *
 * @module modules/admin/store/admin-user-actions
 */

import type { AdminStore, AdminUser, UserStatus } from './adminStore.types';

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;
type Get = () => AdminStore;

/**
 * unknown for the admin module.
 */
/**
 * Creates a new user actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createUserActions(set: Set, get: Get) {
  return {
    fetchUsers: async (_page = 1, _limit = 50) => {
      set({ isLoading: true, error: null });
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get('/api/v1/admin/users', {
          params: { page: _page, limit: _limit },
        });
        set({
          // safe downcast – API response
           
          users: (response.data as AdminUser[]).map((user) => ({ // type assertion: API response data shape
            ...user,
            createdAt: new Date(user.createdAt),
            lastActive: new Date(user.lastActive),
          })),
          isLoading: false,
        });
      } catch {
        set({
          error: 'Failed to load users',
          isLoading: false,
        });
      }
    },

    setUserFilters: (filters: Parameters<AdminStore['setUserFilters']>[0]) =>
      set((state) => ({
        userFilters: { ...state.userFilters, ...filters },
      })),

    selectUser: (id: string) =>
      set((state) => ({
        selectedUserIds: state.selectedUserIds.includes(id)
          ? state.selectedUserIds
          : [...state.selectedUserIds, id].slice(-100),
      })),

    deselectUser: (id: string) =>
      set((state) => ({
        selectedUserIds: state.selectedUserIds.filter((uid) => uid !== id),
      })),

    selectAllUsers: () =>
      set((state) => ({
        selectedUserIds: state.users.map((user) => user.id),
      })),

    clearUserSelection: () => set({ selectedUserIds: [] }),

    banUser: async (id: string, reason: string, duration?: number) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post(`/api/v1/admin/users/${id}/ban`, { reason, duration });
        set((state) => ({
          users: state.users.map(
             
            (user) => (user.id === id ? { ...user, status: 'banned' as UserStatus } : user) // safe downcast – runtime verified
          ),
        }));
      } catch {
        set({ error: 'Failed to ban user' });
      }
    },

    suspendUser: async (id: string, reason: string, duration: number) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post(`/api/v1/admin/users/${id}/suspend`, { reason, duration });
        set((state) => ({
          users: state.users.map(
             
            (user) => (user.id === id ? { ...user, status: 'suspended' as UserStatus } : user) // safe downcast – runtime verified
          ),
        }));
      } catch {
        set({ error: 'Failed to suspend user' });
      }
    },

    warnUser: async (id: string, reason: string) => {
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

    unbanUser: async (id: string) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post(`/api/v1/admin/users/${id}/unban`);
        set((state) => ({
          users: state.users.map(
             
            (user) => (user.id === id ? { ...user, status: 'active' as UserStatus } : user) // safe downcast – runtime verified
          ),
        }));
      } catch {
        set({ error: 'Failed to unban user' });
      }
    },

    changeUserRole: async (id: string, role: AdminUser['role']) => {
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

    // Batch Actions
    batchAction: async (action: string, userIds: string[], params?: Record<string, unknown>) => {
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
  };
}
