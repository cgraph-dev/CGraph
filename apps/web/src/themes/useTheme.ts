/**
 * useTheme Hook
 *
 * React hook for theme management and synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { ThemeRegistry } from './theme-registry';
import type { AppTheme } from './theme-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useTheme');

interface UseThemeReturn {
  currentTheme: AppTheme;
  allThemes: AppTheme[];
  setTheme: (themeId: string) => void;
  switchTheme: (toThemeId: string, duration?: number) => Promise<void>;
  createCustomTheme: (baseThemeId: string, overrides: Partial<AppTheme>) => AppTheme;
  exportTheme: () => string;
  importTheme: (json: string) => void;
  isThemeApplied: (themeId: string) => boolean;
}

/**
 * Hook for managing application theme
 */
export function useTheme(): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(ThemeRegistry.getCurrentTheme());
  const [allThemes, setAllThemes] = useState<AppTheme[]>(ThemeRegistry.getAllThemes());

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const customEvent = event as CustomEvent<{ theme: AppTheme }>; // type assertion: custom event with theme payload
      setCurrentTheme(customEvent.detail.theme);
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  // Apply theme
  const setTheme = useCallback((themeId: string) => {
    const success = ThemeRegistry.applyTheme(themeId);
    if (success) {
      const theme = ThemeRegistry.getTheme(themeId);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  // Switch theme with transition
  const switchTheme = useCallback(
    async (toThemeId: string, duration?: number) => {
      await ThemeRegistry.switchTheme(currentTheme.id, toThemeId, duration);
      const theme = ThemeRegistry.getTheme(toThemeId);
      if (theme) {
        setCurrentTheme(theme);
      }
    },
    [currentTheme.id]
  );

  // Create custom theme
  const createCustomTheme = useCallback((baseThemeId: string, overrides: Partial<AppTheme>) => {
    const customTheme = ThemeRegistry.createCustomTheme(baseThemeId, overrides);
    setAllThemes(ThemeRegistry.getAllThemes());
    return customTheme;
  }, []);

  // Export current theme
  const exportTheme = useCallback(() => {
    return ThemeRegistry.exportTheme(currentTheme.id);
  }, [currentTheme.id]);

  // Import theme
  const importTheme = useCallback((json: string) => {
    try {
      ThemeRegistry.importTheme(json);
      setAllThemes(ThemeRegistry.getAllThemes());
    } catch (error) {
      logger.error('Failed to import theme:', error);
      throw error;
    }
  }, []);

  // Check if theme is currently applied
  const isThemeApplied = useCallback(
    (themeId: string) => {
      return currentTheme.id === themeId;
    },
    [currentTheme.id]
  );

  return {
    currentTheme,
    allThemes,
    setTheme,
    switchTheme,
    createCustomTheme,
    exportTheme,
    importTheme,
    isThemeApplied,
  };
}
