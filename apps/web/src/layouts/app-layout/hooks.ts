/**
 * App Layout hooks - Navigation state, socket connections, and notifications
 * @module layouts/app-layout
 */
import { useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { useChatStore } from '@/modules/chat/store';
import { useGroupStore } from '@/modules/groups/store';
import { useNotificationStore } from '@/modules/social/store';
import { useThemeEnhanced } from '@/contexts/theme-context-enhanced';
import { socketManager } from '@/lib/socket';
import { useE2EEStore, usePreKeyReplenishment } from '@/lib/crypto/e2eeStore';

/**
 * unknown.
 */
/**
 * Hook for managing app layout.
 */
export function useAppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Auto-replenish prekeys when running low
  usePreKeyReplenishment();
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
    if (!user?.id) return; // Don't initialize if not authenticated

    const initializeApp = async () => {
      try {
        await socketManager.connect();
        socketManager.joinUserChannel(user.id);

        // Initialize E2EE (non-blocking — runs in background)
        useE2EEStore.getState().initialize().catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[AppLayout] E2EE initialization error:', err);
        });

        // Fire data fetches in parallel — errors are non-fatal
        await Promise.allSettled([
          fetchConversations(),
          fetchGroups(),
          fetchNotifications(),
        ]);
      } catch (err) {
        // Socket connect failure is non-fatal — app still works without real-time
        // eslint-disable-next-line no-console
        console.warn('[AppLayout] initializeApp error:', err);
      }
    };

    initializeApp();

    return () => {
      socketManager.leaveUserChannel(user.id);
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
