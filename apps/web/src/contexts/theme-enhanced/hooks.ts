/**
 * Enhanced theme context hooks.
 * @module
 */
import { createContext, use, useMemo } from 'react';
import type { ThemeContextValue } from './types';

export const ThemeContextEnhanced = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProviderEnhanced.
 */
export function useThemeEnhanced(): ThemeContextValue {
  const context = use(ThemeContextEnhanced);

  if (context === undefined) {
    throw new Error('useThemeEnhanced must be used within a ThemeProviderEnhanced');
  }

  return context;
}

/**
 * Hook to get just the current theme colors.
 * Optimized for components that only need color values.
 */
export function useThemeColors() {
  const { theme } = useThemeEnhanced();
  return theme.colors;
}

/**
 * Hook to get holographic-specific theme values.
 */
export function useHolographicTheme() {
  const { theme } = useThemeEnhanced();

  return useMemo(
    () => ({
      primary: theme.colors.holoPrimary,
      secondary: theme.colors.holoSecondary,
      accent: theme.colors.holoAccent,
      glow: theme.colors.holoGlow,
      scanline: theme.colors.holoScanline,
      background: theme.colors.holoBackground,
      enableScanlines: theme.animations.enableScanlines,
      enableFlicker: theme.animations.enableFlicker,
      enableGlow: theme.animations.enableGlow,
      enableParallax: theme.animations.enableParallax,
    }),
    [theme],
  );
}

/**
 * Hook to check if current theme is a special theme.
 */
export function useIsSpecialTheme() {
  const { theme } = useThemeEnhanced();
  return theme.category === 'special';
}

/**
 * Hook to check if motion should be reduced.
 */
export function useReducedMotion() {
  const { preferences } = useThemeEnhanced();
  return preferences.settings.reduceMotion;
}
