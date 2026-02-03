import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SettingsStore');

/**
 * Settings Store - Manages user settings with backend sync
 *
 * Features:
 * - Automatic sync with backend on changes
 * - Optimistic updates with rollback on failure
 * - Local caching for offline support
 * - Type-safe settings with defaults
 *
 * @version 0.7.46
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ProfileVisibility = 'public' | 'friends' | 'private';
export type GroupInvitePermission = 'anyone' | 'friends' | 'nobody';
export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type MessageDensity = 'comfortable' | 'compact';
export type DateFormat = 'mdy' | 'dmy' | 'ymd';
export type TimeFormat = 'twelve_hour' | 'twenty_four_hour';

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyFriendRequests: boolean;
  notifyGroupInvites: boolean;
  notifyForumReplies: boolean;
  notificationSound: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null; // HH:MM format
  quietHoursEnd: string | null;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  profileVisibility: ProfileVisibility;
  allowFriendRequests: boolean;
  allowMessageRequests: boolean;
  showInSearch: boolean;
  allowGroupInvites: GroupInvitePermission;
}

export interface AppearanceSettings {
  theme: Theme;
  compactMode: boolean;
  fontSize: FontSize;
  messageDensity: MessageDensity;
  showAvatars: boolean;
  animateEmojis: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

export interface LocaleSettings {
  language: string;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

export interface KeyboardSettings {
  keyboardShortcutsEnabled: boolean;
  customShortcuts: Record<string, string>;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  locale: LocaleSettings;
  keyboard: KeyboardSettings;
}

// Default settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnlineStatus: true,
  showReadReceipts: true,
  showTypingIndicators: true,
  profileVisibility: 'public',
  allowFriendRequests: true,
  allowMessageRequests: true,
  showInSearch: true,
  allowGroupInvites: 'anyone',
};

const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
  compactMode: false,
  fontSize: 'medium',
  messageDensity: 'comfortable',
  showAvatars: true,
  animateEmojis: true,
  reduceMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
};

const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'mdy',
  timeFormat: 'twelve_hour',
};

const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  keyboardShortcutsEnabled: true,
  customShortcuts: {},
};

const DEFAULT_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  locale: DEFAULT_LOCALE_SETTINGS,
  keyboard: DEFAULT_KEYBOARD_SETTINGS,
};

// ============================================================================
// API Response Mapping
// ============================================================================

interface ApiSettings {
  // Notifications
  email_notifications?: boolean;
  push_notifications?: boolean;
  notify_messages?: boolean;
  notify_mentions?: boolean;
  notify_friend_requests?: boolean;
  notify_group_invites?: boolean;
  notify_forum_replies?: boolean;
  notification_sound?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;

  // Privacy
  show_online_status?: boolean;
  show_read_receipts?: boolean;
  show_typing_indicators?: boolean;
  profile_visibility?: ProfileVisibility;
  allow_friend_requests?: boolean;
  allow_message_requests?: boolean;
  show_in_search?: boolean;
  allow_group_invites?: GroupInvitePermission;

  // Appearance
  theme?: Theme;
  compact_mode?: boolean;
  font_size?: FontSize;
  message_density?: MessageDensity;
  show_avatars?: boolean;
  animate_emojis?: boolean;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  screen_reader_optimized?: boolean;

  // Locale
  language?: string;
  timezone?: string;
  date_format?: DateFormat;
  time_format?: TimeFormat;

  // Keyboard
  keyboard_shortcuts_enabled?: boolean;
  custom_shortcuts?: Record<string, string>;
}

function mapSettingsFromApi(data: ApiSettings): UserSettings {
  return {
    notifications: {
      emailNotifications:
        data.email_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
      pushNotifications: data.push_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
      notifyMessages: data.notify_messages ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMessages,
      notifyMentions: data.notify_mentions ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMentions,
      notifyFriendRequests:
        data.notify_friend_requests ?? DEFAULT_NOTIFICATION_SETTINGS.notifyFriendRequests,
      notifyGroupInvites:
        data.notify_group_invites ?? DEFAULT_NOTIFICATION_SETTINGS.notifyGroupInvites,
      notifyForumReplies:
        data.notify_forum_replies ?? DEFAULT_NOTIFICATION_SETTINGS.notifyForumReplies,
      notificationSound: data.notification_sound ?? DEFAULT_NOTIFICATION_SETTINGS.notificationSound,
      quietHoursEnabled:
        data.quiet_hours_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
      quietHoursStart: data.quiet_hours_start ?? null,
      quietHoursEnd: data.quiet_hours_end ?? null,
    },
    privacy: {
      showOnlineStatus: data.show_online_status ?? DEFAULT_PRIVACY_SETTINGS.showOnlineStatus,
      showReadReceipts: data.show_read_receipts ?? DEFAULT_PRIVACY_SETTINGS.showReadReceipts,
      showTypingIndicators:
        data.show_typing_indicators ?? DEFAULT_PRIVACY_SETTINGS.showTypingIndicators,
      profileVisibility: data.profile_visibility ?? DEFAULT_PRIVACY_SETTINGS.profileVisibility,
      allowFriendRequests:
        data.allow_friend_requests ?? DEFAULT_PRIVACY_SETTINGS.allowFriendRequests,
      allowMessageRequests:
        data.allow_message_requests ?? DEFAULT_PRIVACY_SETTINGS.allowMessageRequests,
      showInSearch: data.show_in_search ?? DEFAULT_PRIVACY_SETTINGS.showInSearch,
      allowGroupInvites: data.allow_group_invites ?? DEFAULT_PRIVACY_SETTINGS.allowGroupInvites,
    },
    appearance: {
      theme: data.theme ?? DEFAULT_APPEARANCE_SETTINGS.theme,
      compactMode: data.compact_mode ?? DEFAULT_APPEARANCE_SETTINGS.compactMode,
      fontSize: data.font_size ?? DEFAULT_APPEARANCE_SETTINGS.fontSize,
      messageDensity: data.message_density ?? DEFAULT_APPEARANCE_SETTINGS.messageDensity,
      showAvatars: data.show_avatars ?? DEFAULT_APPEARANCE_SETTINGS.showAvatars,
      animateEmojis: data.animate_emojis ?? DEFAULT_APPEARANCE_SETTINGS.animateEmojis,
      reduceMotion: data.reduce_motion ?? DEFAULT_APPEARANCE_SETTINGS.reduceMotion,
      highContrast: data.high_contrast ?? DEFAULT_APPEARANCE_SETTINGS.highContrast,
      screenReaderOptimized:
        data.screen_reader_optimized ?? DEFAULT_APPEARANCE_SETTINGS.screenReaderOptimized,
    },
    locale: {
      language: data.language ?? DEFAULT_LOCALE_SETTINGS.language,
      timezone: data.timezone ?? DEFAULT_LOCALE_SETTINGS.timezone,
      dateFormat: data.date_format ?? DEFAULT_LOCALE_SETTINGS.dateFormat,
      timeFormat: data.time_format ?? DEFAULT_LOCALE_SETTINGS.timeFormat,
    },
    keyboard: {
      keyboardShortcutsEnabled:
        data.keyboard_shortcuts_enabled ?? DEFAULT_KEYBOARD_SETTINGS.keyboardShortcutsEnabled,
      customShortcuts: data.custom_shortcuts ?? DEFAULT_KEYBOARD_SETTINGS.customShortcuts,
    },
  };
}

function mapSettingsToApi(settings: Partial<UserSettings>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (settings.notifications) {
    const n = settings.notifications;
    if (n.emailNotifications !== undefined) result.email_notifications = n.emailNotifications;
    if (n.pushNotifications !== undefined) result.push_notifications = n.pushNotifications;
    if (n.notifyMessages !== undefined) result.notify_messages = n.notifyMessages;
    if (n.notifyMentions !== undefined) result.notify_mentions = n.notifyMentions;
    if (n.notifyFriendRequests !== undefined)
      result.notify_friend_requests = n.notifyFriendRequests;
    if (n.notifyGroupInvites !== undefined) result.notify_group_invites = n.notifyGroupInvites;
    if (n.notifyForumReplies !== undefined) result.notify_forum_replies = n.notifyForumReplies;
    if (n.notificationSound !== undefined) result.notification_sound = n.notificationSound;
    if (n.quietHoursEnabled !== undefined) result.quiet_hours_enabled = n.quietHoursEnabled;
    if (n.quietHoursStart !== undefined) result.quiet_hours_start = n.quietHoursStart;
    if (n.quietHoursEnd !== undefined) result.quiet_hours_end = n.quietHoursEnd;
  }

  if (settings.privacy) {
    const p = settings.privacy;
    if (p.showOnlineStatus !== undefined) result.show_online_status = p.showOnlineStatus;
    if (p.showReadReceipts !== undefined) result.show_read_receipts = p.showReadReceipts;
    if (p.showTypingIndicators !== undefined)
      result.show_typing_indicators = p.showTypingIndicators;
    if (p.profileVisibility !== undefined) result.profile_visibility = p.profileVisibility;
    if (p.allowFriendRequests !== undefined) result.allow_friend_requests = p.allowFriendRequests;
    if (p.allowMessageRequests !== undefined)
      result.allow_message_requests = p.allowMessageRequests;
    if (p.showInSearch !== undefined) result.show_in_search = p.showInSearch;
    if (p.allowGroupInvites !== undefined) result.allow_group_invites = p.allowGroupInvites;
  }

  if (settings.appearance) {
    const a = settings.appearance;
    if (a.theme !== undefined) result.theme = a.theme;
    if (a.compactMode !== undefined) result.compact_mode = a.compactMode;
    if (a.fontSize !== undefined) result.font_size = a.fontSize;
    if (a.messageDensity !== undefined) result.message_density = a.messageDensity;
    if (a.showAvatars !== undefined) result.show_avatars = a.showAvatars;
    if (a.animateEmojis !== undefined) result.animate_emojis = a.animateEmojis;
    if (a.reduceMotion !== undefined) result.reduce_motion = a.reduceMotion;
    if (a.highContrast !== undefined) result.high_contrast = a.highContrast;
    if (a.screenReaderOptimized !== undefined)
      result.screen_reader_optimized = a.screenReaderOptimized;
  }

  if (settings.locale) {
    const l = settings.locale;
    if (l.language !== undefined) result.language = l.language;
    if (l.timezone !== undefined) result.timezone = l.timezone;
    if (l.dateFormat !== undefined) result.date_format = l.dateFormat;
    if (l.timeFormat !== undefined) result.time_format = l.timeFormat;
  }

  if (settings.keyboard) {
    const k = settings.keyboard;
    if (k.keyboardShortcutsEnabled !== undefined)
      result.keyboard_shortcuts_enabled = k.keyboardShortcutsEnabled;
    if (k.customShortcuts !== undefined) result.custom_shortcuts = k.customShortcuts;
  }

  return result;
}

// ============================================================================
// Store Interface
// ============================================================================

export interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSyncedAt: number | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  updateLocaleSettings: (settings: Partial<LocaleSettings>) => Promise<void>;
  updateKeyboardSettings: (settings: Partial<KeyboardSettings>) => Promise<void>;
  updateAllSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  clearError: () => void;

  // Helpers
  getTheme: () => 'light' | 'dark';
  getShouldReduceMotion: () => boolean;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncedAt: null,

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
    }),
    {
      name: 'cgraph-settings',
      storage: createJSONStorage(() => {
        // Safe localStorage wrapper
        return {
          getItem: (name: string): string | null => {
            try {
              return localStorage.getItem(name);
            } catch (error) {
              logger.warn('Failed to read from localStorage:', error);
              return null;
            }
          },
          setItem: (name: string, value: string): void => {
            try {
              localStorage.setItem(name, value);
            } catch (error) {
              logger.warn('Failed to write to localStorage:', error);
            }
          },
          removeItem: (name: string): void => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              logger.warn('Failed to remove from localStorage:', error);
            }
          },
        };
      }),
      partialize: (state) => ({
        settings: state.settings,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

// Export default settings for testing
export {
  DEFAULT_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
};
