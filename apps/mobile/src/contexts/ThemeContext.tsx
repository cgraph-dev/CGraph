/**
 * ThemeContext — BACKWARD-COMPATIBLE SHIM
 *
 * All state has moved to `stores/themeStore.ts` (Zustand).
 * This file re-exports the same API so 118+ consumers keep working.
 * New code should import directly from `@/stores` or `@/stores/themeStore`.
 *
 * @deprecated Import from '@/stores' or '@/stores/themeStore' instead.
 */

import {
  useThemeStore,
  lightColors,
  darkColors,
} from '../stores/themeStore';
import type { ThemeColors, ColorScheme as ColorSchemeType, ThemePreference as ThemePreferenceType } from '../stores/themeStore';

export type { ThemeColors };
export type ColorSchemeType_Exported = ColorSchemeType;
export type ThemePreferenceType_Exported = ThemePreferenceType;

export { lightColors, darkColors };

/**
 * Drop-in replacement for the old `useTheme()` context hook.
 * Returns the same shape: { colorScheme, themePreference, setThemePreference, colors, isDark }
 */
export function useTheme() {
  const colorScheme = useThemeStore((s) => s.colorScheme);
  const themePreference = useThemeStore((s) => s.themePreference);
  const setThemePreference = useThemeStore((s) => s.setThemePreference);
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);

  return { colorScheme, themePreference, setThemePreference, colors, isDark };
}

/**
 * ThemeProvider — no-op wrapper for backward compatibility.
 * The store hydrates itself; no React context is needed.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import React from 'react';

