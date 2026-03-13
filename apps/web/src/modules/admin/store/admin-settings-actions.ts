/**
 * Admin Settings Actions
 *
 * System settings fetch and update actions.
 *
 * @module modules/admin/store/admin-settings-actions
 */

import type { AdminStore, SystemSetting } from './adminStore.types';

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;

/**
 * unknown for the admin module.
 */
/**
 * Creates a new settings actions.
 *
 * @param set - The set.
 * @returns The newly created instance.
 */
export function createSettingsActions(set: Set) {
  return {
    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get('/api/v1/admin/settings');

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        set({ systemSettings: response.data as SystemSetting[], isLoading: false }); // type assertion: API response data shape
      } catch {
        set({
          error: 'Failed to load system settings',
          isLoading: false,
        });
      }
    },

    updateSetting: async (key: string, value: SystemSetting['value']) => {
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
  };
}
