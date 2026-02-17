/**
 * Settings Store Types
 *
 * Type definitions, interfaces, union types, and default constants
 * for the settings store.
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
  showBio: boolean;
  showPostCount: boolean;
  showJoinDate: boolean;
  showLastActive: boolean;
  showSocialLinks: boolean;
  showActivity: boolean;
  showInMemberList: boolean;
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

// ============================================================================
// Default Settings Constants
// ============================================================================

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnlineStatus: true,
  showReadReceipts: true,
  showTypingIndicators: true,
  profileVisibility: 'public',
  allowFriendRequests: true,
  allowMessageRequests: true,
  showInSearch: true,
  allowGroupInvites: 'anyone',
  showBio: true,
  showPostCount: true,
  showJoinDate: true,
  showLastActive: true,
  showSocialLinks: true,
  showActivity: true,
  showInMemberList: true,
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
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

export const DEFAULT_LOCALE_SETTINGS: LocaleSettings = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'mdy',
  timeFormat: 'twelve_hour',
};

export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  keyboardShortcutsEnabled: true,
  customShortcuts: {},
};

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  locale: DEFAULT_LOCALE_SETTINGS,
  keyboard: DEFAULT_KEYBOARD_SETTINGS,
};

// ============================================================================
// API Response Mapping Types
// ============================================================================

export interface ApiSettings {
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
  show_bio?: boolean;
  show_post_count?: boolean;
  show_join_date?: boolean;
  show_last_active?: boolean;
  show_social_links?: boolean;
  show_activity?: boolean;
  show_in_member_list?: boolean;

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
