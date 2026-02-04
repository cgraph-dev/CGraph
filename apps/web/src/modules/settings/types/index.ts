/**
 * Settings Module Types
 *
 * Type definitions for user settings and preferences.
 *
 * @module modules/settings/types
 * @version 1.0.0
 */

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Message density
 */
export type MessageDensity = 'compact' | 'cozy' | 'spacious';

/**
 * Font size setting
 */
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

/**
 * Notification sound
 */
export type NotificationSound = 'default' | 'chime' | 'bell' | 'pop' | 'subtle' | 'none';

/**
 * Online status visibility
 */
export type StatusVisibility = 'everyone' | 'friends' | 'nobody';

/**
 * Appearance settings
 */
export interface AppearanceSettings {
  theme: ThemeMode;
  accentColor: string;
  messageDensity: MessageDensity;
  fontSize: FontSize;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  showAvatars: boolean;
  compactMode: boolean;
  customCSS?: string;
}

/**
 * Notification channel settings
 */
export interface NotificationChannelSettings {
  enabled: boolean;
  sound: NotificationSound;
  vibrate: boolean;
  preview: boolean;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  directMessages: NotificationChannelSettings;
  groupMessages: NotificationChannelSettings;
  mentions: NotificationChannelSettings;
  forumReplies: NotificationChannelSettings;
  friendRequests: NotificationChannelSettings;
  groupInvites: NotificationChannelSettings;
  systemAnnouncements: NotificationChannelSettings;
  doNotDisturbEnabled: boolean;
  doNotDisturbSchedule?: {
    startTime: string;
    endTime: string;
    days: number[];
  };
  emailNotifications: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'never';
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  onlineStatusVisibility: StatusVisibility;
  lastSeenVisibility: StatusVisibility;
  activityStatusVisibility: StatusVisibility;
  friendRequestsFrom: 'everyone' | 'friends_of_friends' | 'nobody';
  messageRequestsFrom: 'everyone' | 'friends' | 'nobody';
  showInSearchResults: boolean;
  showInMemberLists: boolean;
  allowTagging: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  linkPreview: boolean;
}

/**
 * Security settings
 */
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'authenticator' | 'sms' | 'email';
  loginAlerts: boolean;
  trustedDevices: TrustedDevice[];
  activeSessions: ActiveSession[];
  passwordLastChanged: string;
  securityQuestionSet: boolean;
}

/**
 * Trusted device
 */
export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  lastUsed: string;
  addedAt: string;
}

/**
 * Active session
 */
export interface ActiveSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  screenReaderOptimized: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  autoplayMedia: boolean;
  autoplayGifs: boolean;
  flashingContentWarning: boolean;
  altTextRequired: boolean;
  textToSpeech: boolean;
  speechRate: number;
}

/**
 * Language and region settings
 */
export interface LanguageSettings {
  language: string;
  region: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1 | 6;
  numberFormat: string;
}

/**
 * Chat settings
 */
export interface ChatSettings {
  enterToSend: boolean;
  showTimestamps: boolean;
  timestampFormat: 'relative' | 'absolute';
  groupMessagesByUser: boolean;
  showJoinLeaveMessages: boolean;
  emojiPicker: boolean;
  gifSearch: boolean;
  stickerPicker: boolean;
  spellcheck: boolean;
  autocorrect: boolean;
  markdownPreview: boolean;
  codeHighlighting: boolean;
}

/**
 * Media settings
 */
export interface MediaSettings {
  autoDownloadImages: 'always' | 'wifi' | 'never';
  autoDownloadVideos: 'always' | 'wifi' | 'never';
  autoDownloadFiles: 'always' | 'wifi' | 'never';
  imageQuality: 'original' | 'high' | 'medium' | 'low';
  videoQuality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  dataSaverMode: boolean;
}

/**
 * Audio/Video settings
 */
export interface AudioVideoSettings {
  inputDevice?: string;
  outputDevice?: string;
  videoDevice?: string;
  inputVolume: number;
  outputVolume: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  automaticGainControl: boolean;
  videoMirror: boolean;
  videoBackground: 'none' | 'blur' | 'custom';
  customBackground?: string;
  hardwareAcceleration: boolean;
}

/**
 * All user settings combined
 */
export interface UserSettings {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  accessibility: AccessibilitySettings;
  language: LanguageSettings;
  chat: ChatSettings;
  media: MediaSettings;
  audioVideo: AudioVideoSettings;
}

/**
 * Settings change event
 */
export interface SettingsChangeEvent {
  category: keyof UserSettings;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

/**
 * Settings export/import
 */
export interface SettingsExport {
  version: string;
  exportedAt: string;
  settings: Partial<UserSettings>;
}
