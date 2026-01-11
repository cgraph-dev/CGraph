import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { useAuth } from './AuthContext';

/**
 * Settings Context for React Native Mobile App
 * 
 * Provides centralized settings management with:
 * - Backend API synchronization
 * - AsyncStorage persistence for offline access
 * - Optimistic updates with rollback
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
  quietHoursStart: string | null;
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

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  locale: LocaleSettings;
}

// ============================================================================
// Defaults
// ============================================================================

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

const DEFAULT_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  locale: DEFAULT_LOCALE_SETTINGS,
};

const STORAGE_KEY = '@cgraph_settings';

// ============================================================================
// API Mapping
// ============================================================================

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

// ============================================================================
// Context
// ============================================================================

interface SettingsContextValue {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<void>;
  updateLocaleSettings: (settings: Partial<LocaleSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  clearError: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from storage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load settings from storage:', e);
      }
    };
    loadFromStorage();
  }, []);

  // Fetch from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  // Save to storage whenever settings change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(console.warn);
  }, [settings]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/settings');
      const data = response.data?.data || response.data;
      const newSettings = mapSettingsFromApi(data);
      setSettings(newSettings);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load settings';
      setError(message);
      // Keep cached settings on failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateNotificationSettings = useCallback(async (notificationSettings: Partial<NotificationSettings>) => {
    const previousSettings = settings;
    
    // Optimistic update
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notificationSettings },
    }));
    setIsSaving(true);
    setError(null);
    
    try {
      await api.put('/api/v1/settings/notifications', mapSettingsToApi({ 
        notifications: { ...previousSettings.notifications, ...notificationSettings } 
      }));
    } catch (e) {
      // Rollback on failure
      setSettings(previousSettings);
      const message = e instanceof Error ? e.message : 'Failed to save notification settings';
      setError(message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const updatePrivacySettings = useCallback(async (privacySettings: Partial<PrivacySettings>) => {
    const previousSettings = settings;
    
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...privacySettings },
    }));
    setIsSaving(true);
    setError(null);
    
    try {
      await api.put('/api/v1/settings/privacy', mapSettingsToApi({ 
        privacy: { ...previousSettings.privacy, ...privacySettings } 
      }));
    } catch (e) {
      setSettings(previousSettings);
      const message = e instanceof Error ? e.message : 'Failed to save privacy settings';
      setError(message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const updateAppearanceSettings = useCallback(async (appearanceSettings: Partial<AppearanceSettings>) => {
    const previousSettings = settings;
    
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, ...appearanceSettings },
    }));
    setIsSaving(true);
    setError(null);
    
    try {
      await api.put('/api/v1/settings/appearance', mapSettingsToApi({ 
        appearance: { ...previousSettings.appearance, ...appearanceSettings } 
      }));
    } catch (e) {
      setSettings(previousSettings);
      const message = e instanceof Error ? e.message : 'Failed to save appearance settings';
      setError(message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const updateLocaleSettings = useCallback(async (localeSettings: Partial<LocaleSettings>) => {
    const previousSettings = settings;
    
    setSettings(prev => ({
      ...prev,
      locale: { ...prev.locale, ...localeSettings },
    }));
    setIsSaving(true);
    setError(null);
    
    try {
      await api.put('/api/v1/settings/locale', mapSettingsToApi({ 
        locale: { ...previousSettings.locale, ...localeSettings } 
      }));
    } catch (e) {
      setSettings(previousSettings);
      const message = e instanceof Error ? e.message : 'Failed to save locale settings';
      setError(message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetToDefaults = useCallback(async () => {
    const previousSettings = settings;
    
    setSettings(DEFAULT_SETTINGS);
    setIsSaving(true);
    setError(null);
    
    try {
      await api.post('/api/v1/settings/reset');
    } catch (e) {
      setSettings(previousSettings);
      const message = e instanceof Error ? e.message : 'Failed to reset settings';
      setError(message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAppearanceSettings,
    updateLocaleSettings,
    resetToDefaults,
    clearError,
  }), [
    settings,
    isLoading,
    isSaving,
    error,
    fetchSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAppearanceSettings,
    updateLocaleSettings,
    resetToDefaults,
    clearError,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { DEFAULT_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_PRIVACY_SETTINGS };
