import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '@/modules/settings/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState({
      settings: {
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
      },
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncedAt: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have default settings', () => {
      const state = useSettingsStore.getState();
      expect(state.settings).toBeDefined();
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should have default notification settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.notifications.emailNotifications).toBe(true);
      expect(settings.notifications.pushNotifications).toBe(true);
      expect(settings.notifications.notifyMessages).toBe(true);
    });

    it('should have default privacy settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.privacy.showOnlineStatus).toBe(true);
      expect(settings.privacy.profileVisibility).toBe('public');
      expect(settings.privacy.allowFriendRequests).toBe(true);
    });

    it('should have default appearance settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.appearance.theme).toBe('system');
      expect(settings.appearance.fontSize).toBe('medium');
      expect(settings.appearance.reduceMotion).toBe(false);
    });

    it('should have default locale settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.locale.language).toBe('en');
      expect(settings.locale.dateFormat).toBe('mdy');
      expect(settings.locale.timeFormat).toBe('twelve_hour');
    });

    it('should have default keyboard settings', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.keyboard.keyboardShortcutsEnabled).toBe(true);
      expect(settings.keyboard.customShortcuts).toEqual({});
    });
  });

  describe('Helper Methods', () => {
    it('getTheme should return resolved theme for light', () => {
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          appearance: {
            ...useSettingsStore.getState().settings.appearance,
            theme: 'light',
          },
        },
      });
      const theme = useSettingsStore.getState().getTheme();
      expect(theme).toBe('light');
    });

    it('getTheme should return resolved theme for dark', () => {
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          appearance: {
            ...useSettingsStore.getState().settings.appearance,
            theme: 'dark',
          },
        },
      });
      const theme = useSettingsStore.getState().getTheme();
      expect(theme).toBe('dark');
    });

    it('getShouldReduceMotion should return reduceMotion value', () => {
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          appearance: {
            ...useSettingsStore.getState().settings.appearance,
            reduceMotion: true,
          },
        },
      });
      const shouldReduce = useSettingsStore.getState().getShouldReduceMotion();
      expect(shouldReduce).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('clearError should clear the error state', () => {
      useSettingsStore.setState({ error: 'Some error' });
      useSettingsStore.getState().clearError();
      expect(useSettingsStore.getState().error).toBeNull();
    });
  });

  describe('Settings Structure', () => {
    it('should have all notification fields defined', () => {
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

    it('should have all privacy fields defined', () => {
      const { privacy } = useSettingsStore.getState().settings;
      expect(privacy).toHaveProperty('showOnlineStatus');
      expect(privacy).toHaveProperty('showReadReceipts');
      expect(privacy).toHaveProperty('showTypingIndicators');
      expect(privacy).toHaveProperty('profileVisibility');
      expect(privacy).toHaveProperty('allowFriendRequests');
      expect(privacy).toHaveProperty('allowMessageRequests');
      expect(privacy).toHaveProperty('showInSearch');
      expect(privacy).toHaveProperty('allowGroupInvites');
    });

    it('should have all appearance fields defined', () => {
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
});
