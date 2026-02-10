/**
 * Mobile Settings Store — Zustand replacement for SettingsContext.
 *
 * Manages user preferences with optimistic updates + rollback.
 * Syncs with backend API and persists locally via AsyncStorage.
 *
 * @module stores/settingsStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type ProfileVisibility = 'public' | 'friends' | 'private';
export type GroupInvitePermission = 'anyone' | 'friends' | 'nobody';
export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type MessageDensity = 'comfortable' | 'compact';
export type DateFormat = 'mdy' | 'dmy' | 'ymd';
export type TimeFormat = 'twelve_hour' | 'twenty_four_hour';

export interface NotificationSettings {
  readonly emailNotifications: boolean;
  readonly pushNotifications: boolean;
  readonly notifyMessages: boolean;
  readonly notifyMentions: boolean;
  readonly notifyFriendRequests: boolean;
  readonly notifyGroupInvites: boolean;
  readonly notifyForumReplies: boolean;
  readonly notificationSound: boolean;
  readonly quietHoursEnabled: boolean;
  readonly quietHoursStart: string | null;
  readonly quietHoursEnd: string | null;
}

export interface PrivacySettings {
  readonly showOnlineStatus: boolean;
  readonly showReadReceipts: boolean;
  readonly showTypingIndicators: boolean;
  readonly profileVisibility: ProfileVisibility;
  readonly allowFriendRequests: boolean;
  readonly allowMessageRequests: boolean;
  readonly showInSearch: boolean;
  readonly allowGroupInvites: GroupInvitePermission;
}

export interface AppearanceSettings {
  readonly theme: Theme;
  readonly compactMode: boolean;
  readonly fontSize: FontSize;
  readonly messageDensity: MessageDensity;
  readonly showAvatars: boolean;
  readonly animateEmojis: boolean;
  readonly reduceMotion: boolean;
  readonly highContrast: boolean;
  readonly screenReaderOptimized: boolean;
}

export interface LocaleSettings {
  readonly language: string;
  readonly timezone: string;
  readonly dateFormat: DateFormat;
  readonly timeFormat: TimeFormat;
}

export interface UserSettings {
  readonly notifications: NotificationSettings;
  readonly privacy: PrivacySettings;
  readonly appearance: AppearanceSettings;
  readonly locale: LocaleSettings;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

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

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  locale: DEFAULT_LOCALE_SETTINGS,
};

// ---------------------------------------------------------------------------
// API Mapping (camelCase ↔ snake_case)
// ---------------------------------------------------------------------------

interface ApiSettings {
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
  show_online_status?: boolean;
  show_read_receipts?: boolean;
  show_typing_indicators?: boolean;
  profile_visibility?: ProfileVisibility;
  allow_friend_requests?: boolean;
  allow_message_requests?: boolean;
  show_in_search?: boolean;
  allow_group_invites?: GroupInvitePermission;
  theme?: Theme;
  compact_mode?: boolean;
  font_size?: FontSize;
  message_density?: MessageDensity;
  show_avatars?: boolean;
  animate_emojis?: boolean;
  reduce_motion?: boolean;
  high_contrast?: boolean;
  screen_reader_optimized?: boolean;
  language?: string;
  timezone?: string;
  date_format?: DateFormat;
  time_format?: TimeFormat;
}

function mapSettingsFromApi(data: ApiSettings): UserSettings {
  return {
    notifications: {
      emailNotifications: data.email_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
      pushNotifications: data.push_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
      notifyMessages: data.notify_messages ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMessages,
      notifyMentions: data.notify_mentions ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMentions,
      notifyFriendRequests: data.notify_friend_requests ?? DEFAULT_NOTIFICATION_SETTINGS.notifyFriendRequests,
      notifyGroupInvites: data.notify_group_invites ?? DEFAULT_NOTIFICATION_SETTINGS.notifyGroupInvites,
      notifyForumReplies: data.notify_forum_replies ?? DEFAULT_NOTIFICATION_SETTINGS.notifyForumReplies,
      notificationSound: data.notification_sound ?? DEFAULT_NOTIFICATION_SETTINGS.notificationSound,
      quietHoursEnabled: data.quiet_hours_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
      quietHoursStart: data.quiet_hours_start ?? null,
      quietHoursEnd: data.quiet_hours_end ?? null,
    },
    privacy: {
      showOnlineStatus: data.show_online_status ?? DEFAULT_PRIVACY_SETTINGS.showOnlineStatus,
      showReadReceipts: data.show_read_receipts ?? DEFAULT_PRIVACY_SETTINGS.showReadReceipts,
      showTypingIndicators: data.show_typing_indicators ?? DEFAULT_PRIVACY_SETTINGS.showTypingIndicators,
      profileVisibility: data.profile_visibility ?? DEFAULT_PRIVACY_SETTINGS.profileVisibility,
      allowFriendRequests: data.allow_friend_requests ?? DEFAULT_PRIVACY_SETTINGS.allowFriendRequests,
      allowMessageRequests: data.allow_message_requests ?? DEFAULT_PRIVACY_SETTINGS.allowMessageRequests,
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
      screenReaderOptimized: data.screen_reader_optimized ?? DEFAULT_APPEARANCE_SETTINGS.screenReaderOptimized,
    },
    locale: {
      language: data.language ?? DEFAULT_LOCALE_SETTINGS.language,
      timezone: data.timezone ?? DEFAULT_LOCALE_SETTINGS.timezone,
      dateFormat: data.date_format ?? DEFAULT_LOCALE_SETTINGS.dateFormat,
      timeFormat: data.time_format ?? DEFAULT_LOCALE_SETTINGS.timeFormat,
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
    if (n.notifyFriendRequests !== undefined) result.notify_friend_requests = n.notifyFriendRequests;
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
    if (p.showTypingIndicators !== undefined) result.show_typing_indicators = p.showTypingIndicators;
    if (p.profileVisibility !== undefined) result.profile_visibility = p.profileVisibility;
    if (p.allowFriendRequests !== undefined) result.allow_friend_requests = p.allowFriendRequests;
    if (p.allowMessageRequests !== undefined) result.allow_message_requests = p.allowMessageRequests;
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
    if (a.screenReaderOptimized !== undefined) result.screen_reader_optimized = a.screenReaderOptimized;
  }

  if (settings.locale) {
    const l = settings.locale;
    if (l.language !== undefined) result.language = l.language;
    if (l.timezone !== undefined) result.timezone = l.timezone;
    if (l.dateFormat !== undefined) result.date_format = l.dateFormat;
    if (l.timeFormat !== undefined) result.time_format = l.timeFormat;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@cgraph_settings';

interface SettingsState {
  readonly settings: UserSettings;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
}

interface SettingsActions {
  readonly initialize: () => Promise<void>;
  readonly fetchSettings: () => Promise<void>;
  readonly updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  readonly updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  readonly updateAppearanceSettings: (updates: Partial<AppearanceSettings>) => Promise<void>;
  readonly updateLocaleSettings: (updates: Partial<LocaleSettings>) => Promise<void>;
  readonly resetToDefaults: () => Promise<void>;
  readonly clearError: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const INITIAL_STATE: SettingsState = {
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...INITIAL_STATE,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ settings: JSON.parse(stored) });
      }
    } catch {
      // Keep defaults on failure
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/v1/settings');
      const data = response.data?.data || response.data;
      const newSettings = mapSettingsFromApi(data);
      set({ settings: newSettings, isLoading: false });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)).catch(() => {});
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load settings';
      set({ error: message, isLoading: false });
    }
  },

  updateNotificationSettings: async (updates: Partial<NotificationSettings>) => {
    const previous = get().settings;
    const merged = { ...previous.notifications, ...updates };

    // Optimistic update
    set({
      settings: { ...previous, notifications: merged },
      isSaving: true,
      error: null,
    });
    persistSettings({ ...previous, notifications: merged });

    try {
      await api.put('/api/v1/settings/notifications', mapSettingsToApi({ notifications: merged }));
    } catch (e) {
      // Rollback
      set({ settings: previous, isSaving: false, error: errorMessage(e, 'notification') });
      persistSettings(previous);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  updatePrivacySettings: async (updates: Partial<PrivacySettings>) => {
    const previous = get().settings;
    const merged = { ...previous.privacy, ...updates };

    set({
      settings: { ...previous, privacy: merged },
      isSaving: true,
      error: null,
    });
    persistSettings({ ...previous, privacy: merged });

    try {
      await api.put('/api/v1/settings/privacy', mapSettingsToApi({ privacy: merged }));
    } catch (e) {
      set({ settings: previous, isSaving: false, error: errorMessage(e, 'privacy') });
      persistSettings(previous);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  updateAppearanceSettings: async (updates: Partial<AppearanceSettings>) => {
    const previous = get().settings;
    const merged = { ...previous.appearance, ...updates };

    set({
      settings: { ...previous, appearance: merged },
      isSaving: true,
      error: null,
    });
    persistSettings({ ...previous, appearance: merged });

    try {
      await api.put('/api/v1/settings/appearance', mapSettingsToApi({ appearance: merged }));
    } catch (e) {
      set({ settings: previous, isSaving: false, error: errorMessage(e, 'appearance') });
      persistSettings(previous);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  updateLocaleSettings: async (updates: Partial<LocaleSettings>) => {
    const previous = get().settings;
    const merged = { ...previous.locale, ...updates };

    set({
      settings: { ...previous, locale: merged },
      isSaving: true,
      error: null,
    });
    persistSettings({ ...previous, locale: merged });

    try {
      await api.put('/api/v1/settings/locale', mapSettingsToApi({ locale: merged }));
    } catch (e) {
      set({ settings: previous, isSaving: false, error: errorMessage(e, 'locale') });
      persistSettings(previous);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  resetToDefaults: async () => {
    const previous = get().settings;

    set({ settings: DEFAULT_SETTINGS, isSaving: true, error: null });
    persistSettings(DEFAULT_SETTINGS);

    try {
      await api.post('/api/v1/settings/reset');
    } catch (e) {
      set({ settings: previous, isSaving: false, error: errorMessage(e, 'reset') });
      persistSettings(previous);
      throw e;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function persistSettings(settings: UserSettings): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
}

function errorMessage(e: unknown, category: string): string {
  return e instanceof Error ? e.message : `Failed to save ${category} settings`;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select only the settings object. */
export const useUserSettings = () => useSettingsStore((s) => s.settings);

/** Select only notification settings. */
export const useNotificationSettings = () => useSettingsStore((s) => s.settings.notifications);

/** Select only privacy settings. */
export const usePrivacySettings = () => useSettingsStore((s) => s.settings.privacy);

/** Select only appearance settings. */
export const useAppearanceSettings = () => useSettingsStore((s) => s.settings.appearance);

/** Select only locale settings. */
export const useLocaleSettings = () => useSettingsStore((s) => s.settings.locale);

/** Select saving status. */
export const useIsSaving = () => useSettingsStore((s) => s.isSaving);

/** Select error state. */
export const useSettingsError = () => useSettingsStore((s) => s.error);
