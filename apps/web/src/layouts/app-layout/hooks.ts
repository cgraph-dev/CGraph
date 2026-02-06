/**
 * App Layout hooks - Navigation state, socket connections, and notifications
 * @module layouts/app-layout
 */
import { useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useGroupStore } from '@/stores/groupStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';
import { socketManager } from '@/lib/socket';

export function useAppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { fetchConversations, conversations } = useChatStore();
  const { fetchGroups } = useGroupStore();
  const { fetchNotifications, unreadCount } = useNotificationStore();
  const { theme, preferences } = useThemeEnhanced();

  // Get background settings from preferences
  const backgroundSettings = useMemo(
    () => ({
      effect: preferences.settings.backgroundEffect || 'none',
      variant: preferences.settings.shaderVariant || 'matrix',
      intensity: preferences.settings.backgroundIntensity || 0.6,
    }),
    [
      preferences.settings.backgroundEffect,
      preferences.settings.shaderVariant,
      preferences.settings.backgroundIntensity,
    ]
  );

  // Get colors for shader background based on theme
  const shaderColors = useMemo(() => {
    if (theme.category === 'special' || theme.id === 'matrix') {
      return {
        color1: theme.colors.primary,
        color2: theme.colors.background,
        color3: theme.colors.holoAccent,
      };
    }
    return {
      color1: theme.colors.primary,
      color2: theme.colors.background,
      color3: theme.colors.accent,
    };
  }, [theme]);

  // Initialize socket and fetch data on mount
  useEffect(() => {
    const initializeApp = async () => {
      await socketManager.connect();

      // Join user's personal channel for real-time notifications
      if (user?.id) {
        socketManager.joinUserChannel(user.id);
      }

      fetchConversations();
      fetchGroups();
      fetchNotifications();
    };

    initializeApp();

    return () => {
      // Leave user channel on unmount but keep socket alive
      if (user?.id) {
        socketManager.leaveUserChannel(user.id);
      }
    };
  }, [fetchConversations, fetchGroups, fetchNotifications, user?.id]);

  const handleLogout = useCallback(async () => {
    socketManager.disconnect();
    await logout();
  }, [logout]);

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return {
    location,
    user,
    theme,
    backgroundSettings,
    shaderColors,
    handleLogout,
    totalUnread,
    unreadCount,
  };
}
