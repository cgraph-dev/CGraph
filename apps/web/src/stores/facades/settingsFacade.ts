/**
 * Settings Facade
 *
 * Unified interface for user preferences and customization.
 * Aggregates: settingsStore, themeStore, profileThemeStore, forumThemeStore, customizationStore
 *
 * @module stores/facades/settingsFacade
 */

import { useSettingsStore } from '../../modules/settings/store';
import { useThemeStore } from '../themeStore';
import { useCustomizationStore } from '../unifiedCustomizationStore';

/**
 * Unified settings and customization facade
 * Provides a single hook for all settings-related state and actions
 */
export function useSettingsFacade() {
  const settings = useSettingsStore();
  const theme = useThemeStore();
  const customization = useCustomizationStore();

  return {
    // === User Settings State ===
    settings: settings.settings,
    settingsLoading: settings.isLoading,
    settingsSaving: settings.isSaving,
    settingsError: settings.error,

    // === User Settings Actions ===
    fetchSettings: settings.fetchSettings,
    updateNotificationSettings: settings.updateNotificationSettings,
    updatePrivacySettings: settings.updatePrivacySettings,
    updateAppearanceSettings: settings.updateAppearanceSettings,
    updateLocaleSettings: settings.updateLocaleSettings,
    updateKeyboardSettings: settings.updateKeyboardSettings,
    updateAllSettings: settings.updateAllSettings,
    resetToDefaults: settings.resetToDefaults,
    getTheme: settings.getTheme,
    getShouldReduceMotion: settings.getShouldReduceMotion,

    // === Theme State ===
    colorPreset: theme.colorPreset,
    profileThemeId: theme.profileThemeId,
    chatBubble: theme.chatBubble,
    effectPreset: theme.effectPreset,
    animationSpeed: theme.animationSpeed,
    particlesEnabled: theme.particlesEnabled,
    glowEnabled: theme.glowEnabled,

    // === Theme Actions ===
    setColorPreset: theme.setColorPreset,
    getColors: theme.getColors,
    setProfileTheme: theme.setProfileTheme,
    setProfileCardLayout: theme.setProfileCardLayout,
    updateChatBubble: theme.updateChatBubble,
    applyChatBubblePreset: theme.applyChatBubblePreset,
    resetChatBubble: theme.resetChatBubble,
    setEffectPreset: theme.setEffectPreset,
    setAnimationSpeed: theme.setAnimationSpeed,
    toggleParticles: theme.toggleParticles,
    toggleGlow: theme.toggleGlow,
    syncThemeWithBackend: theme.syncWithBackend,
    resetTheme: theme.resetTheme,

    // === Customization State ===
    customThemePreset: customization.themePreset,
    customEffectPreset: customization.effectPreset,
    customChatBubbleStyle: customization.chatBubbleStyle,
    customizationIsLoading: customization.isLoading,
    customizationIsDirty: customization.isDirty,

    // === Customization Actions ===
    fetchCustomizations: customization.fetchCustomizations,
    saveCustomizations: customization.saveCustomizations,
    updateCustomizationSettings: customization.updateSettings,
    resetCustomizationsToDefaults: customization.resetToDefaults,

    // === Direct Store Access (for edge cases) ===
    _stores: { settings, theme, customization },
  };
}

export type SettingsFacade = ReturnType<typeof useSettingsFacade>;
