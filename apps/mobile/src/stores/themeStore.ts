/**
 * Mobile Theme Store — Zustand replacement for ThemeContext.
 *
 * Manages color scheme, theme preference, and color palettes.
 * Persists preference via AsyncStorage.
 * Listens to system color scheme changes via useColorScheme.
 *
 * @module stores/themeStore
 */

import { create } from 'zustand';
import { Appearance, type ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  readonly colorScheme: ColorScheme;
  readonly themePreference: ThemePreference;
  readonly colors: ThemeColors;
  readonly isDark: boolean;
}

interface ThemeActions {
  readonly setThemePreference: (preference: ThemePreference) => Promise<void>;
  readonly initialize: () => Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEME_STORAGE_KEY = '@cgraph_theme_preference';

// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

/**
 * Light Theme - Clean, professional design with Matrix green accents.
 * Optimized for readability and reduced eye strain.
 */
export const lightColors = {
  // Core backgrounds
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceSecondary: '#f1f5f9',
  surfaceHover: '#e2e8f0',
  surfaceElevated: '#ffffff',

  // Primary brand colors - Matrix green
  primary: '#10b981',
  primaryHover: '#059669',
  primaryLight: '#d1fae5',
  primaryMuted: '#6ee7b7',
  secondary: '#047857',
  accent: '#10b981',

  // Text hierarchy
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  textLink: '#059669',

  // Borders and dividers
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderFocus: '#10b981',
  divider: '#e2e8f0',

  // Semantic colors
  error: '#dc2626',
  errorLight: '#fef2f2',
  success: '#059669',
  successLight: '#d1fae5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  info: '#2563eb',
  infoLight: '#dbeafe',

  // UI elements
  card: '#ffffff',
  cardHover: '#f8fafc',
  input: '#ffffff',
  inputBorder: '#cbd5e1',
  inputFocus: '#10b981',
  inputPlaceholder: '#94a3b8',

  // Interactive states
  disabled: '#e2e8f0',
  disabledText: '#94a3b8',
  highlight: '#fef9c3',
  selection: '#d1fae5',

  // Overlays and shadows
  overlay: 'rgba(15, 23, 42, 0.4)',
  overlayLight: 'rgba(15, 23, 42, 0.1)',
  shadow: 'rgba(15, 23, 42, 0.08)',

  // Matrix-specific colors
  matrix: {
    glow: '#10b981',
    bright: '#34d399',
    dim: '#d1fae5',
  },

  // Chat colors
  chat: {
    bg: '#f8fafc',
    hover: '#f1f5f9',
    input: '#ffffff',
    bubbleSent: '#10b981',
    bubbleSentText: '#ffffff',
    bubbleReceived: '#f1f5f9',
    bubbleReceivedText: '#0f172a',
    timestamp: '#94a3b8',
  },

  // Sidebar colors
  sidebar: {
    bg: '#f1f5f9',
    hover: '#e2e8f0',
    active: '#d1fae5',
    text: '#475569',
    textActive: '#059669',
  },

  // Navigation
  tabBar: {
    bg: '#ffffff',
    border: '#e2e8f0',
    active: '#10b981',
    inactive: '#94a3b8',
  },

  // Status colors
  status: {
    online: '#22c55e',
    idle: '#eab308',
    dnd: '#ef4444',
    offline: '#94a3b8',
    invisible: '#6b7280',
  },

  // Gamification / Rarity colors
  rarity: {
    common: '#6b7280',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ec4899',
    divine: '#f97316',
  },

  // Premium / Gold accents
  premium: {
    gold: '#eab308',
    goldLight: '#fef3c7',
    goldDark: '#ca8a04',
  },
} as const;

/**
 * Dark Theme - Dark theme with Matrix green accents.
 * Optimized for late-night use and OLED screens.
 */
export const darkColors = {
  // Core backgrounds
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  surfaceHover: '#475569',
  surfaceElevated: '#1e293b',

  // Primary brand colors - Matrix green
  primary: '#10b981',
  primaryHover: '#34d399',
  primaryLight: '#064e3b',
  primaryMuted: '#047857',
  secondary: '#6ee7b7',
  accent: '#00ff41',

  // Text hierarchy
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#64748b',
  textInverse: '#0f172a',
  textLink: '#34d399',

  // Borders and dividers
  border: '#334155',
  borderLight: '#1e293b',
  borderFocus: '#10b981',
  divider: '#334155',

  // Semantic colors
  error: '#f87171',
  errorLight: '#450a0a',
  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#451a03',
  info: '#60a5fa',
  infoLight: '#1e3a5f',

  // UI elements
  card: '#1e293b',
  cardHover: '#334155',
  input: '#334155',
  inputBorder: '#475569',
  inputFocus: '#10b981',
  inputPlaceholder: '#64748b',

  // Interactive states
  disabled: '#334155',
  disabledText: '#64748b',
  highlight: '#854d0e',
  selection: '#064e3b',

  // Overlays and shadows
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.4)',

  // Matrix-specific colors
  matrix: {
    glow: '#00ff41',
    bright: '#39ff14',
    dim: '#003b00',
  },

  // Chat colors
  chat: {
    bg: '#1e293b',
    hover: '#334155',
    input: '#334155',
    bubbleSent: '#10b981',
    bubbleSentText: '#ffffff',
    bubbleReceived: '#334155',
    bubbleReceivedText: '#f8fafc',
    timestamp: '#64748b',
  },

  // Sidebar colors
  sidebar: {
    bg: '#0f172a',
    hover: '#1e293b',
    active: '#064e3b',
    text: '#cbd5e1',
    textActive: '#34d399',
  },

  // Navigation
  tabBar: {
    bg: '#0f172a',
    border: '#1e293b',
    active: '#10b981',
    inactive: '#64748b',
  },

  // Status colors
  status: {
    online: '#22c55e',
    idle: '#eab308',
    dnd: '#ef4444',
    offline: '#64748b',
    invisible: '#6b7280',
  },

  // Gamification / Rarity colors
  rarity: {
    common: '#9ca3af',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    epic: '#c084fc',
    legendary: '#fbbf24',
    mythic: '#f472b6',
    divine: '#fb923c',
  },

  // Premium / Gold accents
  premium: {
    gold: '#fbbf24',
    goldLight: '#854d0e',
    goldDark: '#eab308',
  },
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveColorScheme(preference: ThemePreference): ColorScheme {
  if (preference === 'system') {
    return (Appearance.getColorScheme() as ColorSchemeName) === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

function getColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useThemeStore = create<ThemeStore>((set, get) => ({
  colorScheme: 'light',
  themePreference: 'system',
  colors: lightColors,
  isDark: false,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const preference: ThemePreference =
        stored && ['light', 'dark', 'system'].includes(stored)
          ? (stored as ThemePreference)
          : 'system';

      const scheme = resolveColorScheme(preference);
      set({
        themePreference: preference,
        colorScheme: scheme,
        colors: getColors(scheme),
        isDark: scheme === 'dark',
      });
    } catch {
      // Keep defaults on failure
    }
  },

  setThemePreference: async (preference: ThemePreference) => {
    const scheme = resolveColorScheme(preference);
    set({
      themePreference: preference,
      colorScheme: scheme,
      colors: getColors(scheme),
      isDark: scheme === 'dark',
    });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, preference).catch(() => {});
  },
}));

// ---------------------------------------------------------------------------
// System color scheme listener
// ---------------------------------------------------------------------------

const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  const { themePreference } = useThemeStore.getState();
  if (themePreference !== 'system') return;

  const scheme: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  useThemeStore.setState({
    colorScheme: scheme,
    colors: getColors(scheme),
    isDark: scheme === 'dark',
  });
});

// Export subscription for cleanup if needed (e.g., in tests)
export const _themeSubscription = subscription;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select only the colors object. Re-renders only when scheme changes. */
export const useColors = () => useThemeStore((s) => s.colors);

/** Select only dark mode flag. */
export const useIsDark = () => useThemeStore((s) => s.isDark);

/** Select the current color scheme (light/dark). */
export const useColorScheme = () => useThemeStore((s) => s.colorScheme);

/** Select theme preference (light/dark/system). */
export const useThemePreference = () => useThemeStore((s) => s.themePreference);
