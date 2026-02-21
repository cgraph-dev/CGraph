/**
 * SettingsContext — Re-export layer from Zustand stores.
 *
 * All state lives in `stores/settingsStore.ts` (Zustand).
 * This file re-exports the same API so existing consumers keep working.
 * New code should import directly from `@/stores` or `@/stores/settingsStore`.
 *
 * @deprecated Import from '@/stores' or '@/stores/settingsStore' instead.
 */

import { useSettingsStore } from '../stores/settingsStore';

// Re-export types for backward compatibility
export type {
  ProfileVisibility,
  GroupInvitePermission,
  Theme,
  FontSize,
  MessageDensity,
  DateFormat,
  TimeFormat,
  NotificationSettings,
  PrivacySettings,
  AppearanceSettings,
  LocaleSettings,
  UserSettings,
} from '../stores/settingsStore';

export { DEFAULT_SETTINGS } from '../stores/settingsStore';

// Keep old default exports for any files importing them
const DEFAULT_NOTIFICATION_SETTINGS = {
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
} as const;

const DEFAULT_PRIVACY_SETTINGS = {
  showOnlineStatus: true,
  showReadReceipts: true,
  showTypingIndicators: true,
  profileVisibility: 'public' as const,
  allowFriendRequests: true,
  allowMessageRequests: true,
  showInSearch: true,
  allowGroupInvites: 'anyone' as const,
} as const;

export { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_PRIVACY_SETTINGS };

/**
 * Drop-in replacement for the old `useSettings()` context hook.
 * Returns the same shape as the original SettingsContextValue.
 */
export function useSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const isLoading = useSettingsStore((s) => s.isLoading);
  const isSaving = useSettingsStore((s) => s.isSaving);
  const error = useSettingsStore((s) => s.error);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateNotificationSettings = useSettingsStore((s) => s.updateNotificationSettings);
  const updatePrivacySettings = useSettingsStore((s) => s.updatePrivacySettings);
  const updateAppearanceSettings = useSettingsStore((s) => s.updateAppearanceSettings);
  const updateLocaleSettings = useSettingsStore((s) => s.updateLocaleSettings);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);
  const clearError = useSettingsStore((s) => s.clearError);

  return {
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
  };
}
