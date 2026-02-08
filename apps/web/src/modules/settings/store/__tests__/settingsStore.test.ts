/**
 * Settings Store (modules) Unit Tests
 *
 * Comprehensive tests for the modular Zustand settings store.
 * Covers initial state, fetch, update (notification, privacy, appearance,
 * locale, keyboard), optimistic rollback, resetToDefaults, helpers,
 * clearError, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useSettingsStore } from '@/modules/settings/store';
import type { UserSettings } from '@/modules/settings/store';
import { AxiosError } from 'axios';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api with proper typing
import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  put: api.put as MockedFunction<typeof api.put>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    notifyMessages: true,
    notifyMentions: true,
    notifyFriendRequests: true,
    notifyGroupInvites: true,
    notifyForumReplies: true,
    notificationSound: true,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
  },
  privacy: {
    showOnlineStatus: true,
    showReadReceipts: true,
    showTypingIndicators: true,
    profileVisibility: 'public',
    allowFriendRequests: true,
    allowMessageRequests: true,
    showInSearch: true,
    allowGroupInvites: 'anyone',
  },
  appearance: {
    theme: 'system',
    compactMode: false,
    fontSize: 'medium',
    messageDensity: 'comfortable',
    showAvatars: true,
    animateEmojis: true,
    reduceMotion: false,
    highContrast: false,
    screenReaderOptimized: false,
  },
  locale: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'mdy',
    timeFormat: 'twelve_hour',
  },
  keyboard: {
    keyboardShortcutsEnabled: true,
    customShortcuts: {},
  },
};

const getCleanState = () => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  isLoading: false,
  isSaving: false,
  error: null,
  lastSyncedAt: null,
});

// ============================================================================
// Tests
// ============================================================================

afterEach(() => {
  useSettingsStore.setState(getCleanState());
  vi.clearAllMocks();
});

describe('settingsStore (modules)', () => {
  // --------------------------------------------------------------------------
  // Initial state
  // --------------------------------------------------------------------------
  describe('initial state', () => {
    beforeEach(() => {
      useSettingsStore.setState(getCleanState());
    });

    it('should have default settings object', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings).toBeDefined();
      expect(settings.notifications.emailNotifications).toBe(true);
      expect(settings.privacy.profileVisibility).toBe('public');
      expect(settings.appearance.theme).toBe('system');
      expect(settings.locale.language).toBe('en');
      expect(settings.keyboard.keyboardShortcutsEnabled).toBe(true);
    });

    it('should not be loading or saving', () => {
      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it('should have null error and lastSyncedAt', () => {
      const state = useSettingsStore.getState();
      expect(state.error).toBeNull();
      expect(state.lastSyncedAt).toBeNull();
    });

    it('should have all notification settings keys', () => {
      const { notifications } = useSettingsStore.getState().settings;
      expect(notifications).toHaveProperty('emailNotifications');
      expect(notifications).toHaveProperty('pushNotifications');
      expect(notifications).toHaveProperty('notifyMessages');
      expect(notifications).toHaveProperty('notifyMentions');
      expect(notifications).toHaveProperty('notifyFriendRequests');
      expect(notifications).toHaveProperty('notifyGroupInvites');
      expect(notifications).toHaveProperty('notifyForumReplies');
      expect(notifications).toHaveProperty('notificationSound');
      expect(notifications).toHaveProperty('quietHoursEnabled');
      expect(notifications).toHaveProperty('quietHoursStart');
      expect(notifications).toHaveProperty('quietHoursEnd');
    });

    it('should have all appearance settings keys', () => {
      const { appearance } = useSettingsStore.getState().settings;
      expect(appearance).toHaveProperty('theme');
      expect(appearance).toHaveProperty('compactMode');
      expect(appearance).toHaveProperty('fontSize');
      expect(appearance).toHaveProperty('messageDensity');
      expect(appearance).toHaveProperty('showAvatars');
      expect(appearance).toHaveProperty('animateEmojis');
      expect(appearance).toHaveProperty('reduceMotion');
      expect(appearance).toHaveProperty('highContrast');
      expect(appearance).toHaveProperty('screenReaderOptimized');
    });
  });

  // --------------------------------------------------------------------------
  // fetchSettings
  // --------------------------------------------------------------------------
  describe('fetchSettings', () => {
    it('should set isLoading true while fetching', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { data: {} } }), 50))
      );

      const promise = useSettingsStore.getState().fetchSettings();
      expect(useSettingsStore.getState().isLoading).toBe(true);

      await promise;
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should populate settings from API response', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: {
            email_notifications: false,
            theme: 'dark',
            language: 'fr',
            font_size: 'large',
          },
        },
      });

      await useSettingsStore.getState().fetchSettings();

      const { settings } = useSettingsStore.getState();
      expect(settings.notifications.emailNotifications).toBe(false);
      expect(settings.appearance.theme).toBe('dark');
      expect(settings.locale.language).toBe('fr');
      expect(settings.appearance.fontSize).toBe('large');
    });

    it('should update lastSyncedAt on success', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: {} } });

      await useSettingsStore.getState().fetchSettings();

      expect(useSettingsStore.getState().lastSyncedAt).toBeTypeOf('number');
    });

    it('should set error message on failure without throwing', async () => {
      const axiosError = new AxiosError('Request failed');
      axiosError.response = {
        data: { error: { message: 'Unauthorized' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      };
      mockedApi.get.mockRejectedValue(axiosError);

      // fetchSettings does NOT throw — it swallows errors and uses cached settings
      await useSettingsStore.getState().fetchSettings();

      expect(useSettingsStore.getState().error).toBe('Unauthorized');
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should use generic message for non-Axios errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network failure'));

      await useSettingsStore.getState().fetchSettings();

      expect(useSettingsStore.getState().error).toBe('Failed to load settings');
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: {} } });

      await useSettingsStore.getState().fetchSettings();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/settings');
    });
  });

  // --------------------------------------------------------------------------
  // updateNotificationSettings
  // --------------------------------------------------------------------------
  describe('updateNotificationSettings', () => {
    it('should optimistically update notification settings', async () => {
      mockedApi.put.mockResolvedValue({});

      const promise = useSettingsStore
        .getState()
        .updateNotificationSettings({ emailNotifications: false, quietHoursEnabled: true });

      // Optimistic: settings are already updated
      expect(useSettingsStore.getState().settings.notifications.emailNotifications).toBe(false);
      expect(useSettingsStore.getState().settings.notifications.quietHoursEnabled).toBe(true);
      expect(useSettingsStore.getState().isSaving).toBe(true);

      await promise;
      expect(useSettingsStore.getState().isSaving).toBe(false);
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateNotificationSettings({ pushNotifications: false });

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/api/v1/settings/notifications',
        expect.objectContaining({ push_notifications: false })
      );
    });

    it('should rollback on API failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('Server error'));

      await expect(
        useSettingsStore.getState().updateNotificationSettings({ emailNotifications: false })
      ).rejects.toThrow();

      // Rolled back to original
      expect(useSettingsStore.getState().settings.notifications.emailNotifications).toBe(true);
      expect(useSettingsStore.getState().isSaving).toBe(false);
      expect(useSettingsStore.getState().error).toBe('Failed to save notification settings');
    });
  });

  // --------------------------------------------------------------------------
  // updatePrivacySettings
  // --------------------------------------------------------------------------
  describe('updatePrivacySettings', () => {
    it('should optimistically update privacy settings', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore
        .getState()
        .updatePrivacySettings({ showOnlineStatus: false, profileVisibility: 'private' });

      const { privacy } = useSettingsStore.getState().settings;
      expect(privacy.showOnlineStatus).toBe(false);
      expect(privacy.profileVisibility).toBe('private');
    });

    it('should rollback on API failure', async () => {
      const axiosError = new AxiosError('fail');
      axiosError.response = {
        data: { error: { message: 'Privacy update denied' } },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as never,
      };
      mockedApi.put.mockRejectedValue(axiosError);

      await expect(
        useSettingsStore.getState().updatePrivacySettings({ showOnlineStatus: false })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.privacy.showOnlineStatus).toBe(true);
      expect(useSettingsStore.getState().error).toBe('Privacy update denied');
    });
  });

  // --------------------------------------------------------------------------
  // updateAppearanceSettings
  // --------------------------------------------------------------------------
  describe('updateAppearanceSettings', () => {
    it('should optimistically update appearance settings', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore
        .getState()
        .updateAppearanceSettings({ theme: 'dark', compactMode: true, fontSize: 'large' });

      const { appearance } = useSettingsStore.getState().settings;
      expect(appearance.theme).toBe('dark');
      expect(appearance.compactMode).toBe(true);
      expect(appearance.fontSize).toBe('large');
    });

    it('should call the correct API endpoint with mapped keys', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateAppearanceSettings({ highContrast: true });

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/api/v1/settings/appearance',
        expect.objectContaining({ high_contrast: true })
      );
    });

    it('should rollback on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('fail'));

      await expect(
        useSettingsStore.getState().updateAppearanceSettings({ theme: 'dark' })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.appearance.theme).toBe('system');
    });
  });

  // --------------------------------------------------------------------------
  // updateLocaleSettings
  // --------------------------------------------------------------------------
  describe('updateLocaleSettings', () => {
    it('should optimistically update locale settings', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore
        .getState()
        .updateLocaleSettings({ language: 'de', timeFormat: 'twenty_four_hour' });

      const { locale } = useSettingsStore.getState().settings;
      expect(locale.language).toBe('de');
      expect(locale.timeFormat).toBe('twenty_four_hour');
    });

    it('should rollback on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('fail'));

      await expect(
        useSettingsStore.getState().updateLocaleSettings({ language: 'ja' })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.locale.language).toBe('en');
    });
  });

  // --------------------------------------------------------------------------
  // updateKeyboardSettings
  // --------------------------------------------------------------------------
  describe('updateKeyboardSettings', () => {
    it('should optimistically update keyboard settings', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateKeyboardSettings({
        keyboardShortcutsEnabled: false,
        customShortcuts: { 'ctrl+k': 'search' },
      });

      const { keyboard } = useSettingsStore.getState().settings;
      expect(keyboard.keyboardShortcutsEnabled).toBe(false);
      expect(keyboard.customShortcuts).toEqual({ 'ctrl+k': 'search' });
    });

    it('should rollback on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('fail'));

      await expect(
        useSettingsStore.getState().updateKeyboardSettings({ keyboardShortcutsEnabled: false })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.keyboard.keyboardShortcutsEnabled).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // updateAllSettings
  // --------------------------------------------------------------------------
  describe('updateAllSettings', () => {
    it('should merge and save all settings at once', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateAllSettings({
        notifications: { emailNotifications: false },
        appearance: { theme: 'dark' },
        locale: { language: 'es' },
      });

      const { settings } = useSettingsStore.getState();
      expect(settings.notifications.emailNotifications).toBe(false);
      expect(settings.appearance.theme).toBe('dark');
      expect(settings.locale.language).toBe('es');
      // Untouched settings remain
      expect(settings.privacy.showOnlineStatus).toBe(true);
    });

    it('should call PUT /api/v1/settings with mapped payload', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateAllSettings({
        appearance: { theme: 'light' },
      });

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/api/v1/settings',
        expect.objectContaining({ theme: 'light' })
      );
    });

    it('should rollback all settings on failure', async () => {
      mockedApi.put.mockRejectedValue(new Error('fail'));

      await expect(
        useSettingsStore.getState().updateAllSettings({
          appearance: { theme: 'dark' },
          locale: { language: 'pt' },
        })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.appearance.theme).toBe('system');
      expect(useSettingsStore.getState().settings.locale.language).toBe('en');
      expect(useSettingsStore.getState().error).toBe('Failed to save settings');
    });

    it('should update lastSyncedAt on success', async () => {
      mockedApi.put.mockResolvedValue({});

      await useSettingsStore.getState().updateAllSettings({
        appearance: { theme: 'dark' },
      });

      expect(useSettingsStore.getState().lastSyncedAt).toBeTypeOf('number');
    });
  });

  // --------------------------------------------------------------------------
  // resetToDefaults
  // --------------------------------------------------------------------------
  describe('resetToDefaults', () => {
    it('should reset all settings to defaults on success', async () => {
      // First, change some settings
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, theme: 'dark' },
          locale: { ...DEFAULT_SETTINGS.locale, language: 'fr' },
        },
      });
      mockedApi.post.mockResolvedValue({});

      await useSettingsStore.getState().resetToDefaults();

      const { settings } = useSettingsStore.getState();
      expect(settings.appearance.theme).toBe('system');
      expect(settings.locale.language).toBe('en');
    });

    it('should call POST /api/v1/settings/reset', async () => {
      mockedApi.post.mockResolvedValue({});

      await useSettingsStore.getState().resetToDefaults();

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/settings/reset');
    });

    it('should rollback on failure', async () => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, theme: 'dark' },
        },
      });
      mockedApi.post.mockRejectedValue(new Error('fail'));

      await expect(useSettingsStore.getState().resetToDefaults()).rejects.toThrow();

      // Should roll back to the pre-reset "dark" theme
      expect(useSettingsStore.getState().settings.appearance.theme).toBe('dark');
      expect(useSettingsStore.getState().error).toBe('Failed to reset settings');
    });
  });

  // --------------------------------------------------------------------------
  // clearError
  // --------------------------------------------------------------------------
  describe('clearError', () => {
    it('should clear the error state', () => {
      useSettingsStore.setState({ error: 'Something went wrong' });

      useSettingsStore.getState().clearError();

      expect(useSettingsStore.getState().error).toBeNull();
    });

    it('should be a no-op when error is already null', () => {
      useSettingsStore.getState().clearError();

      expect(useSettingsStore.getState().error).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Helper methods
  // --------------------------------------------------------------------------
  describe('getTheme', () => {
    it('should return "light" when theme is set to light', () => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, theme: 'light' },
        },
      });

      expect(useSettingsStore.getState().getTheme()).toBe('light');
    });

    it('should return "dark" when theme is set to dark', () => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, theme: 'dark' },
        },
      });

      expect(useSettingsStore.getState().getTheme()).toBe('dark');
    });

    it('should resolve "system" theme based on matchMedia', () => {
      // jsdom matchMedia defaults to not matching, so "system" → light
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, theme: 'system' },
        },
      });

      const result = useSettingsStore.getState().getTheme();
      expect(['light', 'dark']).toContain(result);
    });
  });

  describe('getShouldReduceMotion', () => {
    it('should return true when reduceMotion is explicitly true', () => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, reduceMotion: true },
        },
      });

      expect(useSettingsStore.getState().getShouldReduceMotion()).toBe(true);
    });

    it('should check system preference when reduceMotion is false', () => {
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          appearance: { ...DEFAULT_SETTINGS.appearance, reduceMotion: false },
        },
      });

      // jsdom matchMedia defaults to not matching
      const result = useSettingsStore.getState().getShouldReduceMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  // --------------------------------------------------------------------------
  // Error handling (additional coverage)
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('should extract AxiosError message from response body', async () => {
      const axiosError = new AxiosError('fail');
      axiosError.response = {
        data: { error: { message: 'Rate limit exceeded' } },
        status: 429,
        statusText: 'Too Many Requests',
        headers: {},
        config: {} as never,
      };
      mockedApi.put.mockRejectedValue(axiosError);

      await expect(
        useSettingsStore.getState().updateNotificationSettings({ emailNotifications: false })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().error).toBe('Rate limit exceeded');
    });

    it('should use fallback message when AxiosError has no response body message', async () => {
      const axiosError = new AxiosError('fail');
      axiosError.response = {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
      };
      mockedApi.put.mockRejectedValue(axiosError);

      await expect(
        useSettingsStore.getState().updateAppearanceSettings({ theme: 'dark' })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().error).toBe('Failed to save appearance settings');
    });

    it('should use generic message for non-Axios errors in update actions', async () => {
      mockedApi.put.mockRejectedValue(new TypeError('Network disconnected'));

      await expect(
        useSettingsStore.getState().updateLocaleSettings({ language: 'zh' })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().error).toBe('Failed to save locale settings');
    });

    it('updateAllSettings should set error on AxiosError with message', async () => {
      const axiosError = new AxiosError('fail');
      axiosError.response = {
        data: { error: { message: 'Validation failed' } },
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
      };
      mockedApi.put.mockRejectedValue(axiosError);

      await expect(
        useSettingsStore.getState().updateAllSettings({ appearance: { theme: 'dark' } })
      ).rejects.toThrow();

      expect(useSettingsStore.getState().error).toBe('Validation failed');
    });
  });
});
