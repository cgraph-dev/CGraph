/**
 * Mobile Store Facade — single re-export barrel for all Zustand stores.
 *
 * Consumers import from `@/stores` instead of individual store files.
 * Pattern mirrors web's 7-domain store architecture with facade hooks.
 *
 * @module stores
 */

import { useMemo } from 'react';

// ─── Auth ────────────────────────────────────────────────────────────────────
export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthToken,
} from './authStore';

// ─── Theme ───────────────────────────────────────────────────────────────────
export {
  useThemeStore,
  useColors,
  useIsDark,
  useColorScheme,
  useThemePreference,
  lightColors,
  darkColors,
} from './themeStore';
export type { ThemeColors, ColorScheme, ThemePreference } from './themeStore';

// ─── Settings ────────────────────────────────────────────────────────────────
export {
  useSettingsStore,
  useUserSettings,
  useNotificationSettings,
  usePrivacySettings,
  useAppearanceSettings,
  useLocaleSettings,
  useIsSaving,
  useSettingsError,
  DEFAULT_SETTINGS,
} from './settingsStore';
export type {
  UserSettings,
  NotificationSettings,
  PrivacySettings,
  AppearanceSettings,
  LocaleSettings,
  ProfileVisibility,
  GroupInvitePermission,
  Theme,
  FontSize,
  MessageDensity,
  DateFormat,
  TimeFormat,
} from './settingsStore';

// ─── Customization ──────────────────────────────────────────────────────────
export { useCustomizationStore } from './customizationStore';

// =============================================================================
// FACADE HOOKS — 7-domain API matching web architecture
// =============================================================================

import { useAuthStore as _useAuth } from './authStore';
import { useThemeStore as _useTheme } from './themeStore';
import { useSettingsStore as _useSettings } from './settingsStore';
import { useCustomizationStore as _useCustomization } from './customizationStore';

/**
 * Auth facade — auth, user, wallet, session.
 */
export function useAuthFacade() {
  const user = _useAuth((s) => s.user);
  const token = _useAuth((s) => s.token);
  const isAuthenticated = _useAuth((s) => s.isAuthenticated);
  const isLoading = _useAuth((s) => s.isLoading);
  const login = _useAuth((s) => s.login);
  const logout = _useAuth((s) => s.logout);
  const initialize = _useAuth((s) => s.initialize);

  return useMemo(
    () => ({ user, token, isAuthenticated, isLoading, login, logout, initialize }),
    [user, token, isAuthenticated, isLoading, login, logout, initialize],
  );
}

/**
 * Chat facade — conversations, messages, typing, reactions.
 * Stub: Underlying chat store not yet migrated to Zustand.
 */
export function useChatFacade() {
  return useMemo(
    () => ({
      conversations: [] as unknown[],
      activeConversation: null as unknown,
      messages: [] as unknown[],
      typingUsers: [] as string[],
      sendMessage: async (_channelId: string, _content: string) => {},
      setActiveConversation: (_id: string | null) => {},
      markAsRead: async (_conversationId: string) => {},
    }),
    [],
  );
}

/**
 * Community facade — forums, groups, servers, channels.
 * Stub: Underlying community store not yet migrated to Zustand.
 */
export function useCommunityFacade() {
  return useMemo(
    () => ({
      groups: [] as unknown[],
      channels: [] as unknown[],
      forums: [] as unknown[],
      activeGroup: null as unknown,
      activeChannel: null as unknown,
      joinGroup: async (_groupId: string) => {},
      leaveGroup: async (_groupId: string) => {},
      setActiveChannel: (_id: string | null) => {},
    }),
    [],
  );
}

/**
 * Gamification facade — XP, karma, achievements, effects.
 * Stub: Underlying gamification store not yet migrated to Zustand.
 */
export function useGamificationFacade() {
  return useMemo(
    () => ({
      xp: 0,
      level: 1,
      karma: 0,
      achievements: [] as unknown[],
      badges: [] as unknown[],
      streak: 0,
      fetchGamificationData: async () => {},
    }),
    [],
  );
}

/**
 * Settings facade — privacy, notifications, profile.
 */
export function useSettingsFacade() {
  const settings = _useSettings((s) => s.settings);
  const isSaving = _useSettings((s) => s.isSaving);
  const error = _useSettings((s) => s.error);
  const fetchSettings = _useSettings((s) => s.fetchSettings);
  const resetToDefaults = _useSettings((s) => s.resetToDefaults);

  return useMemo(
    () => ({
      settings,
      isSaving,
      error,
      fetchSettings,
      resetToDefaults,
      notifications: settings?.notifications ?? null,
      privacy: settings?.privacy ?? null,
      appearance: settings?.appearance ?? null,
    }),
    [settings, isSaving, error, fetchSettings, resetToDefaults],
  );
}

/**
 * Marketplace facade — items, purchases, inventory.
 * Stub: Underlying marketplace store not yet migrated to Zustand.
 */
export function useMarketplaceFacade() {
  return useMemo(
    () => ({
      items: [] as unknown[],
      inventory: [] as unknown[],
      balance: 0,
      purchaseItem: async (_itemId: string) => {},
      fetchInventory: async () => {},
    }),
    [],
  );
}

/**
 * UI facade — theme, sidebar, modals, toasts.
 */
export function useUIFacade() {
  const isDark = _useTheme((s) => s.colorScheme === 'dark');
  const colorScheme = _useTheme((s) => s.colorScheme);
  const setThemePreference = _useTheme((s) => s.setThemePreference);
  const customization = _useCustomization((s) => s.theme);

  return useMemo(
    () => ({
      isDark,
      colorScheme,
      setThemePreference,
      customization,
      // Stub: sidebar/modal/toast state
      isSidebarOpen: false,
      setSidebarOpen: (_open: boolean) => {},
      activeModal: null as string | null,
      showModal: (_id: string) => {},
      hideModal: () => {},
    }),
    [isDark, colorScheme, setThemePreference, customization],
  );
}

// ---------------------------------------------------------------------------
// Initialization helper — call once in App.tsx
// ---------------------------------------------------------------------------

import { useAuthStore } from './authStore';
import { useThemeStore } from './themeStore';
import { useSettingsStore } from './settingsStore';
import { useCustomizationStore } from './customizationStore';

/**
 * Initialize all stores that need async hydration.
 * Call once during app startup (e.g., in App.tsx before splash screen hide).
 * Returns a promise that resolves when all stores are hydrated.
 */
export async function initializeStores(): Promise<void> {
  await Promise.all([
    useThemeStore.getState().initialize(),
    useSettingsStore.getState().initialize(),
    useAuthStore.getState().initialize(),
    useCustomizationStore.getState().loadTheme(),
  ]);
}

/**
 * React hook for store initialization in a component.
 * Calls initializeStores() on mount and tracks readiness.
 */
export function useStoreInitialization() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    initializeStores()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true)); // Fail-open to not block app launch
  }, []);

  return isReady;
}
