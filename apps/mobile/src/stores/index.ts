/**
 * Mobile Store Facade — single re-export barrel for all Zustand stores.
 *
 * Consumers import from `@/stores` instead of individual store files.
 * Pattern mirrors web's 7-domain store architecture with facade hooks.
 *
 * @module stores
 */

import { useMemo, useState, useEffect } from 'react';

// ─── Chat ────────────────────────────────────────────────────────────────────
export { useChatStore, useConversations, useActiveConversationId } from './chatStore';
export type { Message, Conversation, Reaction } from './chatStore';

// ─── Groups ──────────────────────────────────────────────────────────────────
export { useGroupStore, useGroups, useActiveGroupId } from './groupStore';
export type { ChannelMessage } from './groupStore';

// ─── Notifications ───────────────────────────────────────────────────────────
export { useNotificationStore, useUnreadCount, useNotifications } from './notificationStore';
export type { Notification } from './notificationStore';

// ─── Friends ─────────────────────────────────────────────────────────────────
export { useFriendStore, useFriends, usePendingRequests, useFriendCount } from './friendStore';
export type { Friend, FriendRequest } from './friendStore';

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

// ─── Forums ──────────────────────────────────────────────────────────────────
export {
  useForumStore,
  useForums,
  useCurrentForum,
  useForumThreads,
  useForumSearchResults,
  useForumLoading,
  useForumError,
} from './forumStore';

// ─── Customization ──────────────────────────────────────────────────────────
export { useCustomizationStore } from './customizationStore';
// ─── Creator ─────────────────────────────────────────────────────────
export {
  useCreatorStore,
  useIsCreator,
  useCreatorStatus,
  useCreatorBalance,
  useCreatorPayouts,
} from './creatorStore';
// =============================================================================
// FACADE HOOKS — 7-domain API matching web architecture
// =============================================================================

import { useAuthStore as _useAuth } from './authStore';
import { useThemeStore as _useTheme } from './themeStore';
import { useSettingsStore as _useSettings } from './settingsStore';
import { useCustomizationStore as _useCustomization } from './customizationStore';
import { useChatStore as _useChat } from './chatStore';
import { useGroupStore as _useGroup } from './groupStore';
import { useForumStore as _useForum } from './forumStore';

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
    [user, token, isAuthenticated, isLoading, login, logout, initialize]
  );
}

/**
 * Chat facade — conversations, messages, typing, reactions.
 * Wired to real chatStore (v0.9.31).
 */
export function useChatFacade() {
  const conversations = _useChat((s) => s.conversations);
  const activeConversationId = _useChat((s) => s.activeConversationId);
  const messages = _useChat((s) => s.messages);
  const typingUsers = _useChat((s) => s.typingUsers);
  const sendMessage = _useChat((s) => s.sendMessage);
  const setActiveConversation = _useChat((s) => s.setActiveConversation);
  const markAsRead = _useChat((s) => s.markAsRead);

  return useMemo(
    () => ({
      conversations,
      activeConversation: activeConversationId
        ? conversations.find((c) => c.id === activeConversationId) || null
        : null,
      messages: activeConversationId ? messages[activeConversationId] || [] : [],
      typingUsers: activeConversationId ? typingUsers[activeConversationId] || [] : [],
      sendMessage,
      setActiveConversation,
      markAsRead,
    }),
    [
      conversations,
      activeConversationId,
      messages,
      typingUsers,
      sendMessage,
      setActiveConversation,
      markAsRead,
    ]
  );
}

/**
 * Community facade — forums, groups, servers, channels.
 * Wired to real groupStore (v0.9.31).
 */
export function useCommunityFacade() {
  const groups = _useGroup((s) => s.groups);
  const activeGroupId = _useGroup((s) => s.activeGroupId);
  const activeChannelId = _useGroup((s) => s.activeChannelId);
  const joinGroup = _useGroup((s) => s.joinGroup);
  const leaveGroup = _useGroup((s) => s.leaveGroup);
  const setActiveChannel = _useGroup((s) => s.setActiveChannel);
  const forums = _useForum((s) => s.forums);

  return useMemo(() => {
    const activeGroup = activeGroupId ? groups.find((g) => g.id === activeGroupId) : undefined;
    let channels: unknown[] = [];
    if (activeGroup && 'channels' in activeGroup && Array.isArray(activeGroup.channels)) {
      channels = activeGroup.channels;
    }
    return {
      groups,
      channels,
      forums,
      activeGroup: activeGroup ?? null,
      activeChannel: activeChannelId,
      joinGroup,
      leaveGroup,
      setActiveChannel,
    };
  }, [groups, activeGroupId, activeChannelId, joinGroup, leaveGroup, setActiveChannel, forums]);
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
    [settings, isSaving, error, fetchSettings, resetToDefaults]
  );
}

/**
 * UI facade — theme, sidebar, modals, toasts.
 *
 * Sidebar and modal methods are no-ops on mobile:
 * - Sidebar: Web-only layout concept; mobile uses bottom tabs / drawer navigation.
 * - Modals: Managed by React Navigation modal stack, not global store state.
 */
export function useUIFacade() {
  const isDark = _useTheme((s) => s.colorScheme === 'dark');
  const colorScheme = _useTheme((s) => s.colorScheme);
  const setThemePreference = _useTheme((s) => s.setThemePreference);
  const customization = _useCustomization((s) => s.theme);
  const activeModal: string | null = null;

  return useMemo(
    () => ({
      isDark,
      colorScheme,
      setThemePreference,
      customization,
      // Web-only: sidebar is a desktop layout concept; mobile uses bottom tabs / drawer nav
      isSidebarOpen: false,
      setSidebarOpen: (_open: boolean) => {
        /* no-op — mobile uses React Navigation drawer instead */
      },
      // Mobile: modals are managed by React Navigation modal stack
      activeModal,
      showModal: (_id: string) => {
        /* no-op — use navigation.navigate() with modal presentation */
      },
      hideModal: () => {
        /* no-op — use navigation.goBack() to dismiss modals */
      },
    }),
    [isDark, colorScheme, setThemePreference, customization]
  );
}

// ---------------------------------------------------------------------------
// Initialization helper — call once in App.tsx
// ---------------------------------------------------------------------------

import { useFriendStore } from './friendStore';
import { useNotificationStore } from './notificationStore';

/**
 * Initialize all stores that need async hydration.
 * Call once during app startup (e.g., in App.tsx before splash screen hide).
 * Returns a promise that resolves when all stores are hydrated.
 *
 * Phase 1: Core stores (auth, theme, settings, customization) — must complete.
 * Phase 2: Data stores (chat, groups, gamification, friends, notifications) — best-effort.
 */
export async function initializeStores(): Promise<void> {
  // Phase 1: Core stores — block on these
  await Promise.all([
    _useTheme.getState().initialize(),
    _useSettings.getState().initialize(),
    _useAuth.getState().initialize(),
    _useCustomization.getState().loadTheme(),
  ]);

  // Phase 2: Data stores — fetch in background after auth is ready
  const isAuth = _useAuth.getState().isAuthenticated;
  if (isAuth) {
    Promise.all([
      _useChat.getState().fetchConversations(),
      _useGroup.getState().fetchGroups(),
      useFriendStore.getState().fetchFriends(),
      useNotificationStore.getState().fetchNotifications(true),
    ]).catch(() => {
      // Non-critical — app still usable if these fail
    });
  }
}

/**
 * React hook for store initialization in a component.
 * Calls initializeStores() on mount and tracks readiness.
 */
export function useStoreInitialization() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeStores()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true)); // Fail-open to not block app launch
  }, []);

  return isReady;
}
