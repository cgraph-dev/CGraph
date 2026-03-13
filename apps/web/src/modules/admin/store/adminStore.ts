/**
 * Admin Store
 *
 * Thin orchestrator that composes action slices from submodules.
 *
 * @module modules/admin/store
 * @version 2.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { AdminStats, AdminState, AdminStore } from './adminStore.types';
import { createModerationActions } from './admin-moderation-actions';
import { createEventActions } from './admin-event-actions';
import { createUserActions } from './admin-user-actions';
import { createSettingsActions } from './admin-settings-actions';

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
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              stats: response.data as AdminStats, // type assertion: API response data shape
              statsLastUpdated: new Date(),
              isLoading: false,
            });
          } catch {
            set({
              error: 'Failed to load dashboard stats',
              isLoading: false,
            });
          }
        },

        refreshStats: async () => {
          await get().fetchStats();
        },

        // Composed action slices
        ...createModerationActions(set),
        ...createEventActions(set, get),
        ...createUserActions(set, get),
        ...createSettingsActions(set),
        reset: () =>
          set({
            ...initialState,
          }),
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
