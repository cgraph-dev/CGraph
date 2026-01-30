/**
 * Store Hooks
 *
 * Composite hooks that combine multiple stores for common use cases.
 * Components should use these hooks instead of importing stores directly.
 *
 * This layer allows us to:
 * 1. Control which store slices are exposed to components
 * 2. Add memoization and optimization
 * 3. Refactor underlying stores without changing component code
 *
 * @module stores/hooks
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';
import { useFriendStore } from './friendStore';
import { useNotificationStore } from './notificationStore';
import { useThemeStore } from './themeStore';
import { useGamificationStore } from './gamificationStore';

/**
 * Current user data with authentication state.
 * Use this in components that need user info.
 */
export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoggedIn: isAuthenticated && !!token && !!user,
      userId: user?.id ?? null,
      username: user?.username ?? null,
      displayName: user?.displayName ?? user?.username ?? null,
      avatarUrl: user?.avatarUrl ?? null,
    }),
    [user, isAuthenticated, token]
  );
}

/**
 * Authentication actions.
 * Separate from user data to prevent re-renders.
 */
export function useAuthActions() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const register = useAuthStore((state) => state.register);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMemo(
    () => ({ login, logout, register, refreshToken }),
    [login, logout, register, refreshToken]
  );
}

/**
 * Chat state for a specific conversation.
 * Optimized to only subscribe to relevant data.
 */
export function useConversation(conversationId: string | null | undefined) {
  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);

  return useMemo(() => {
    const conversation = conversationId ? conversations.find((c) => c.id === conversationId) : null;
    const conversationMessages = conversationId ? (messages[conversationId] ?? []) : [];
    const typing = conversationId ? (typingUsers[conversationId] ?? []) : [];

    return {
      conversation,
      messages: conversationMessages,
      typingUsers: typing,
      isLoading: isLoadingMessages,
      exists: !!conversation,
    };
  }, [conversationId, conversations, messages, typingUsers, isLoadingMessages]);
}

/**
 * Chat actions for sending messages and managing conversations.
 */
export function useChatActions() {
  const sendMessage = useChatStore((state) => state.sendMessage);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const editMessage = useChatStore((state) => state.editMessage);

  return useMemo(
    () => ({
      sendMessage,
      fetchMessages,
      markAsRead,
      setActiveConversation,
      deleteMessage,
      editMessage,
    }),
    [sendMessage, fetchMessages, markAsRead, setActiveConversation, deleteMessage, editMessage]
  );
}

/**
 * Friends list with online status.
 */
export function useFriends() {
  const friends = useFriendStore((state) => state.friends);
  const pendingRequests = useFriendStore((state) => state.pendingRequests);
  const isLoading = useFriendStore((state) => state.isLoading);

  return useMemo(() => {
    const onlineFriends = friends.filter((f) => f.status === 'online');
    const offlineFriends = friends.filter((f) => f.status !== 'online');

    return {
      friends,
      onlineFriends,
      offlineFriends,
      pendingRequests,
      pendingCount: pendingRequests.length,
      isLoading,
    };
  }, [friends, pendingRequests, isLoading]);
}

/**
 * Notification state with unread count.
 */
export function useNotifications() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      hasUnread: unreadCount > 0,
    }),
    [notifications, unreadCount, isLoading]
  );
}

/**
 * Current theme configuration.
 */
export function useAppTheme() {
  const colorPreset = useThemeStore((state) => state.colorPreset);
  const setColorPreset = useThemeStore((state) => state.setColorPreset);

  return useMemo(
    () => ({
      colorPreset,
      setColorPreset,
    }),
    [colorPreset, setColorPreset]
  );
}

/**
 * Gamification stats for current user.
 */
export function useUserStats() {
  const level = useGamificationStore((state) => state.level);
  const xp = useGamificationStore((state) => state.xp);
  const currentXP = useGamificationStore((state) => state.currentXP);
  const totalXP = useGamificationStore((state) => state.totalXP);
  const karma = useGamificationStore((state) => state.karma);
  const loginStreak = useGamificationStore((state) => state.loginStreak);
  const achievements = useGamificationStore((state) => state.achievements);

  return useMemo(() => {
    // Calculate XP needed for next level (simplified formula)
    const xpForNextLevel = level * 1000;
    const progress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

    return {
      level,
      xp,
      currentXP,
      totalXP,
      xpToNextLevel: xpForNextLevel - currentXP,
      progress,
      karma,
      streak: loginStreak,
      achievements,
      achievementCount: achievements?.length ?? 0,
    };
  }, [level, xp, currentXP, totalXP, karma, loginStreak, achievements]);
}
