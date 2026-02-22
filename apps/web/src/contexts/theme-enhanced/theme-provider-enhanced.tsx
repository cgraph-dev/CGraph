/**
 * Enhanced Theme Context Provider
 *
 * React context provider for the CGraph theming system.
 * Provides theme state, settings, and utilities to all components.
 */

import { useEffect, useState, useCallback, type ReactNode, useMemo } from 'react';
import {
  type Theme,
  type ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/theme-engine';
import type { ThemeContextValue } from './types';
import { ThemeContextEnhanced } from './hooks';

interface ThemeProviderEnhancedProps {
  children: ReactNode;
  /** Initial theme ID (optional) */
  initialTheme?: string;
}

export function ThemeProviderEnhanced({ children, initialTheme }: ThemeProviderEnhancedProps) {
  const [theme, setThemeState] = useState<Theme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    themeEngine.getPreferences(),
  );

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = themeEngine.subscribe((newTheme) => {
      setThemeState(newTheme);
      setPreferences(themeEngine.getPreferences());
    });

    return unsubscribe;
  }, []);

  // Apply initial theme if provided
  useEffect(() => {
    if (initialTheme && THEME_REGISTRY[initialTheme]) {
      themeEngine.setTheme(initialTheme);
    }
  }, [initialTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!preferences.settings.respectSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const prefs = themeEngine.getPreferences();
      if (prefs.settings.respectSystemPreference) {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        themeEngine.setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.settings.respectSystemPreference]);

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      if (mediaQuery.matches) {
        themeEngine.updateSettings({ reduceMotion: true });
      }
    };

    // Check initial value
    if (mediaQuery.matches) {
      handleChange();
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Set theme by ID
  const setTheme = useCallback((themeId: string) => {
    themeEngine.setTheme(themeId);
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<ThemePreferences['settings']>) => {
    themeEngine.updateSettings(settings);
    setPreferences(themeEngine.getPreferences());
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const currentCategory = theme.category;
    const newThemeId = currentCategory === 'dark' ? 'light' : 'dark';
    themeEngine.setTheme(newThemeId);
  }, [theme.category]);

  // Set font scale
  const setFontScale = useCallback(
    (scale: number) => {
      const clampedScale = Math.max(0.8, Math.min(1.4, scale));
      updateSettings({ fontScale: clampedScale });
    },
    [updateSettings],
  );

  // Set message display
  const setMessageDisplay = useCallback(
    (mode: 'cozy' | 'compact') => {
      updateSettings({ messageDisplay: mode });
    },
    [updateSettings],
  );

  // Set message spacing
  const setMessageSpacing = useCallback(
    (spacing: number) => {
      const clampedSpacing = Math.max(0.5, Math.min(2, spacing));
      updateSettings({ messageSpacing: clampedSpacing });
    },
    [updateSettings],
  );

  // Toggle reduced motion
  const toggleReduceMotion = useCallback(() => {
    updateSettings({ reduceMotion: !preferences.settings.reduceMotion });
  }, [preferences.settings.reduceMotion, updateSettings]);

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !preferences.settings.highContrast });
  }, [preferences.settings.highContrast, updateSettings]);

  // Toggle system preference
  const toggleSystemPreference = useCallback(() => {
    updateSettings({ respectSystemPreference: !preferences.settings.respectSystemPreference });
  }, [preferences.settings.respectSystemPreference, updateSettings]);

  // Create custom theme
  const createCustomTheme = useCallback((newTheme: Omit<Theme, 'isBuiltIn'>): Theme => {
    const created = themeEngine.createCustomTheme(newTheme);
    setPreferences(themeEngine.getPreferences());
    return created;
  }, []);

  // Delete custom theme
  const deleteCustomTheme = useCallback((themeId: string): boolean => {
    const result = themeEngine.deleteCustomTheme(themeId);
    if (result) {
      setPreferences(themeEngine.getPreferences());
    }
    return result;
  }, []);

  // Compute derived values
  const isSystemPreference = preferences.settings.respectSystemPreference;
  const resolvedBaseTheme = theme.category === 'light' ? 'light' : 'dark';
  const availableThemes = useMemo(() => getAllThemes(), [preferences.customThemes]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      preferences,
      availableThemes,
      isSystemPreference,
      resolvedBaseTheme,
      setTheme,
      updateSettings,
      toggleDarkMode,
      setFontScale,
      setMessageDisplay,
      setMessageSpacing,
      toggleReduceMotion,
      toggleHighContrast,
      toggleSystemPreference,
      createCustomTheme,
      deleteCustomTheme,
    }),
    [
      theme,
      preferences,
      availableThemes,
      isSystemPreference,
      resolvedBaseTheme,
      setTheme,
      updateSettings,
      toggleDarkMode,
      setFontScale,
      setMessageDisplay,
      setMessageSpacing,
      toggleReduceMotion,
      toggleHighContrast,
      toggleSystemPreference,
      createCustomTheme,
      deleteCustomTheme,
    ],
  );

  return <ThemeContextEnhanced.Provider value={value}>{children}</ThemeContextEnhanced.Provider>;
}
