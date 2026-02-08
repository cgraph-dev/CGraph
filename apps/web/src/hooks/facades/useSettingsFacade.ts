/**
 * Settings Facade Hook
 *
 * Discord-style composition hook that aggregates user settings,
 * customization, theme, and plugin state into a single preferences interface.
 *
 * @example
 * ```tsx
 * const {
 *   theme, compactMode, fontSize,
 *   updateNotificationSettings,
 *   updatePrivacySettings,
 * } = useSettingsFacade();
 * ```
 *
 * @module hooks/facades/useSettingsFacade
 */

import { useMemo } from 'react';
import { useSettingsStore } from '@/modules/settings/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { useThemeStore } from '@/stores/theme';

export interface SettingsFacade {
  // Appearance
  theme: string;
  compactMode: boolean;
  fontSize: string;
  reduceMotion: boolean;
  highContrast: boolean;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyFriendRequests: boolean;

  // Privacy
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  profileVisibility: string;
  allowFriendRequests: boolean;

  // Customization
  themePreset: string;
  effectPreset: string;
  animationSpeed: string;
  particlesEnabled: boolean;
  glowEnabled: boolean;

  // Loading
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Record<string, unknown>) => void;
  updateNotificationSettings: (updates: Record<string, unknown>) => void;
  updatePrivacySettings: (updates: Record<string, unknown>) => void;
  updateAppearanceSettings: (updates: Record<string, unknown>) => void;
}

/**
 * Composes settings, customization, and theme state.
 */
export function useSettingsFacade(): SettingsFacade {
  // Settings store
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoading = useSettingsStore((s) => s.isLoading);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateNotificationSettings = useSettingsStore((s) => s.updateNotificationSettings);
  const updatePrivacySettings = useSettingsStore((s) => s.updatePrivacySettings);
  const updateAppearanceSettings = useSettingsStore((s) => s.updateAppearanceSettings);

  // Customization store
  const themePreset = useCustomizationStore((s) => s.themePreset);
  const effectPreset = useCustomizationStore((s) => s.effectPreset);
  const animationSpeed = useCustomizationStore((s) => s.animationSpeed);
  const particlesEnabled = useCustomizationStore((s) => s.particlesEnabled);
  const glowEnabled = useCustomizationStore((s) => s.glowEnabled);
  const isSaving = useCustomizationStore((s) => s.isSaving);
  const updateCustomization = useCustomizationStore((s) => s.updateSettings);

  // Theme store
  const theme = useThemeStore((s) => s.colorPreset);

  // Derived from settings
  const compactMode = settings?.appearance?.compactMode ?? false;
  const fontSize = settings?.appearance?.fontSize ?? 'medium';
  const reduceMotion = settings?.appearance?.reduceMotion ?? false;
  const highContrast = settings?.appearance?.highContrast ?? false;
  const emailNotifications = settings?.notifications?.emailNotifications ?? true;
  const pushNotifications = settings?.notifications?.pushNotifications ?? true;
  const notifyMessages = settings?.notifications?.notifyMessages ?? true;
  const notifyMentions = settings?.notifications?.notifyMentions ?? true;
  const notifyFriendRequests = settings?.notifications?.notifyFriendRequests ?? true;
  const showOnlineStatus = settings?.privacy?.showOnlineStatus ?? true;
  const showReadReceipts = settings?.privacy?.showReadReceipts ?? true;
  const showTypingIndicators = settings?.privacy?.showTypingIndicators ?? true;
  const profileVisibility = settings?.privacy?.profileVisibility ?? 'public';
  const allowFriendRequests = settings?.privacy?.allowFriendRequests ?? true;

  return useMemo(
    () => ({
      theme,
      compactMode,
      fontSize,
      reduceMotion,
      highContrast,
      emailNotifications,
      pushNotifications,
      notifyMessages,
      notifyMentions,
      notifyFriendRequests,
      showOnlineStatus,
      showReadReceipts,
      showTypingIndicators,
      profileVisibility,
      allowFriendRequests,
      themePreset,
      effectPreset,
      animationSpeed,
      particlesEnabled,
      glowEnabled,
      isLoading: settingsLoading,
      isSaving,
      fetchSettings,
      updateSettings: updateCustomization,
      updateNotificationSettings,
      updatePrivacySettings,
      updateAppearanceSettings,
    }),
    [
      theme,
      compactMode,
      fontSize,
      reduceMotion,
      highContrast,
      emailNotifications,
      pushNotifications,
      notifyMessages,
      notifyMentions,
      notifyFriendRequests,
      showOnlineStatus,
      showReadReceipts,
      showTypingIndicators,
      profileVisibility,
      allowFriendRequests,
      themePreset,
      effectPreset,
      animationSpeed,
      particlesEnabled,
      glowEnabled,
      settingsLoading,
      isSaving,
      fetchSettings,
      updateCustomization,
      updateNotificationSettings,
      updatePrivacySettings,
      updateAppearanceSettings,
    ]
  );
}
