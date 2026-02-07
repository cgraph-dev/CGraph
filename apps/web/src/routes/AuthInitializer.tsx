/**
 * Auth Initializer Provider
 *
 * Non-blocking app bootstrapper that checks authentication,
 * fetches gamification data, applies theme CSS variables,
 * loads user customizations, and syncs theme with server.
 *
 * @module routes/AuthInitializer
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useGamificationStore } from '@/modules/gamification/store';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useCustomizationStore } from '@/stores/customization';
import { ThemeRegistry } from '@/themes/ThemeRegistry';
import { useCustomizationApplication } from '@/hooks/useCustomizationApplication';
import { authLogger, themeLogger, gamificationLogger } from '@/lib/logger';

/**
 * Initializes authentication, gamification, customization, and theme state.
 * Renders children immediately — never blocks rendering.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const fetchGamificationData = useGamificationStore((state) => state.fetchGamificationData);
  const colorPreset = useThemeStore((state) => state.theme.colorPreset);
  const syncWithServer = useThemeStore((state) => state.syncWithServer);
  const fetchCustomizations = useCustomizationStore((state) => state.fetchCustomizations);

  // Apply customization settings to UI
  useCustomizationApplication();

  // Auth check — runs once on mount only
  useEffect(() => {
    authLogger.debug('Starting auth check on mount');
    checkAuth()
      .catch((error) => {
        authLogger.error(error, 'Auth check failed');
      })
      .finally(() => {
        authLogger.debug('Auth check complete');
      });
  }, [checkAuth]);

  // Fetch gamification data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      gamificationLogger.debug('Fetching gamification data...');
      fetchGamificationData().catch((error) => {
        gamificationLogger.error(error, 'Gamification fetch failed');
      });
    }
  }, [isAuthenticated, fetchGamificationData]);
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomizations().catch((error) => {
        authLogger.error('Customization initialization failed:', error);
      });
    }
  }, [isAuthenticated, fetchCustomizations]);
  useEffect(() => {
    const appThemeId = localStorage.getItem('cgraph-app-theme') || 'default';
    ThemeRegistry.applyTheme(appThemeId);

    const colors = THEME_COLORS[colorPreset];
    if (colors) {
      const root = document.documentElement;
      root.style.setProperty('--user-theme-primary', colors.primary);
      root.style.setProperty('--user-theme-secondary', colors.secondary);
      root.style.setProperty('--user-theme-glow', colors.glow);
      root.style.setProperty('--user-theme-gradient', colors.gradient);
      themeLogger.debug('Applied user customizations:', colorPreset, colors);
    }
    themeLogger.debug('Applied app theme:', appThemeId);
  }, [colorPreset]);

  // Sync theme with server when user logs in
  useEffect(() => {
    if (isAuthenticated && userId) {
      themeLogger.debug('Syncing theme with server for user:', userId);
      syncWithServer(userId).catch((error) => {
        themeLogger.error(error, 'Theme sync failed');
      });
    }
  }, [isAuthenticated, userId, syncWithServer]);

  return <>{children}</>;
}
