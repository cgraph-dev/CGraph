/**
 * Settings Store Actions
 *
 * All zustand action implementations for the settings store,
 * extracted for modularity.
 *
 * @version 0.7.46
 */

import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import type { UserSettings, SettingsState } from './settingsStore.types';
import { DEFAULT_SETTINGS } from './settingsStore.types';
import { mapSettingsFromApi, mapSettingsToApi } from './settings-mappers';

type Set = (
  partial: Partial<SettingsState> | ((state: SettingsState) => Partial<SettingsState>)
) => void;
type Get = () => SettingsState;

/**
 * unknown for the settings module.
 */
/**
 * Creates a new settings actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createSettingsActions(
  set: Set,
  get: Get
): Pick<
  SettingsState,
  | 'fetchSettings'
  | 'updateNotificationSettings'
  | 'updatePrivacySettings'
  | 'updateAppearanceSettings'
  | 'updateLocaleSettings'
  | 'updateKeyboardSettings'
  | 'updateAllSettings'
  | 'resetToDefaults'
  | 'clearError'
  | 'getTheme'
  | 'getShouldReduceMotion'
> {
  return {
    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get('/api/v1/settings');
        const data = response.data?.data || response.data;
        const settings = mapSettingsFromApi(data);
        set({
          settings,
          isLoading: false,
          lastSyncedAt: Date.now(),
        });
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? error.response?.data?.error?.message || 'Failed to load settings'
            : 'Failed to load settings';
        set({ isLoading: false, error: message });
        // Don't throw - use cached settings on failure
      }
    },

    updateNotificationSettings: async (notificationSettings) => {
      const previousSettings = get().settings;

      // Optimistic update
      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          notifications: { ...previousSettings.notifications, ...notificationSettings },
        },
      });

      try {
        await api.put(
          '/api/v1/settings/notifications',
          mapSettingsToApi({
            notifications: { ...previousSettings.notifications, ...notificationSettings },
          })
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        // Rollback on failure
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save notification settings'
              : 'Failed to save notification settings',
        });
        throw error;
      }
    },

    updatePrivacySettings: async (privacySettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          privacy: { ...previousSettings.privacy, ...privacySettings },
        },
      });

      try {
        await api.put(
          '/api/v1/settings/privacy',
          mapSettingsToApi({
            privacy: { ...previousSettings.privacy, ...privacySettings },
          })
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save privacy settings'
              : 'Failed to save privacy settings',
        });
        throw error;
      }
    },

    updateAppearanceSettings: async (appearanceSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          appearance: { ...previousSettings.appearance, ...appearanceSettings },
        },
      });

      try {
        await api.put(
          '/api/v1/settings/appearance',
          mapSettingsToApi({
            appearance: { ...previousSettings.appearance, ...appearanceSettings },
          })
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save appearance settings'
              : 'Failed to save appearance settings',
        });
        throw error;
      }
    },

    updateLocaleSettings: async (localeSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          locale: { ...previousSettings.locale, ...localeSettings },
        },
      });

      try {
        await api.put(
          '/api/v1/settings/locale',
          mapSettingsToApi({
            locale: { ...previousSettings.locale, ...localeSettings },
          })
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save locale settings'
              : 'Failed to save locale settings',
        });
        throw error;
      }
    },

    updateKeyboardSettings: async (keyboardSettings) => {
      const previousSettings = get().settings;

      set({
        isSaving: true,
        error: null,
        settings: {
          ...previousSettings,
          keyboard: { ...previousSettings.keyboard, ...keyboardSettings },
        },
      });

      try {
        await api.put(
          '/api/v1/settings',
          mapSettingsToApi({
            keyboard: { ...previousSettings.keyboard, ...keyboardSettings },
          })
        );
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save keyboard settings'
              : 'Failed to save keyboard settings',
        });
        throw error;
      }
    },

    updateAllSettings: async (newSettings) => {
      const previousSettings = get().settings;

      const mergedSettings: UserSettings = {
        notifications: { ...previousSettings.notifications, ...newSettings.notifications },
        privacy: { ...previousSettings.privacy, ...newSettings.privacy },
        appearance: { ...previousSettings.appearance, ...newSettings.appearance },
        locale: { ...previousSettings.locale, ...newSettings.locale },
        keyboard: { ...previousSettings.keyboard, ...newSettings.keyboard },
      };

      set({ isSaving: true, error: null, settings: mergedSettings });

      try {
        await api.put('/api/v1/settings', mapSettingsToApi(mergedSettings));
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to save settings'
              : 'Failed to save settings',
        });
        throw error;
      }
    },

    resetToDefaults: async () => {
      const previousSettings = get().settings;

      set({ isSaving: true, error: null, settings: DEFAULT_SETTINGS });

      try {
        await api.post('/api/v1/settings/reset');
        set({ isSaving: false, lastSyncedAt: Date.now() });
      } catch (error) {
        set({
          settings: previousSettings,
          isSaving: false,
          error:
            error instanceof AxiosError
              ? error.response?.data?.error?.message || 'Failed to reset settings'
              : 'Failed to reset settings',
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    // Helper: Get resolved theme (respects system preference)
    getTheme: () => {
      const { theme } = get().settings.appearance;
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    },

    // Helper: Check if motion should be reduced
    getShouldReduceMotion: () => {
      const { reduceMotion } = get().settings.appearance;
      if (reduceMotion) return true;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
  };
}
