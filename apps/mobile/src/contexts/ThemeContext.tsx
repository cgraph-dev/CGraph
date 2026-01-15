import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  colors: typeof lightColors | typeof darkColors;
  isDark: boolean;
}

/**
 * Light Theme - Clean, professional design with Matrix green accents
 * Optimized for readability and reduced eye strain
 */
const lightColors = {
  // Core backgrounds
  background: '#ffffff',
  surface: '#f8fafc',           // Slightly warmer than pure gray
  surfaceSecondary: '#f1f5f9',
  surfaceHover: '#e2e8f0',
  surfaceElevated: '#ffffff',   // For cards that need to pop
  
  // Primary brand colors - Matrix green
  primary: '#10b981',           // Emerald-500
  primaryHover: '#059669',      // Emerald-600
  primaryLight: '#d1fae5',      // Emerald-100 - for backgrounds
  primaryMuted: '#6ee7b7',      // Emerald-300
  secondary: '#047857',         // Emerald-700
  accent: '#10b981',            // Toned down from pure matrix green for light theme
  
  // Text hierarchy
  text: '#0f172a',              // Slate-900 - rich black
  textSecondary: '#475569',     // Slate-600
  textTertiary: '#94a3b8',      // Slate-400
  textInverse: '#ffffff',       // For dark backgrounds
  textLink: '#059669',          // Emerald-600 for links
  
  // Borders and dividers
  border: '#e2e8f0',            // Slate-200
  borderLight: '#f1f5f9',       // Slate-100
  borderFocus: '#10b981',       // Primary color for focus states
  divider: '#e2e8f0',
  
  // Semantic colors
  error: '#dc2626',             // Red-600 (darker for better contrast)
  errorLight: '#fef2f2',        // Red-50
  success: '#059669',           // Emerald-600
  successLight: '#d1fae5',      // Emerald-100
  warning: '#d97706',           // Amber-600
  warningLight: '#fef3c7',      // Amber-100
  info: '#2563eb',              // Blue-600
  infoLight: '#dbeafe',         // Blue-100
  
  // UI elements
  card: '#ffffff',
  cardHover: '#f8fafc',
  input: '#ffffff',
  inputBorder: '#cbd5e1',       // Slate-300
  inputFocus: '#10b981',
  inputPlaceholder: '#94a3b8',  // Slate-400
  
  // Interactive states
  disabled: '#e2e8f0',
  disabledText: '#94a3b8',
  highlight: '#fef9c3',         // Yellow-100 for search highlights
  selection: '#d1fae5',         // Emerald-100
  
  // Overlays and shadows
  overlay: 'rgba(15, 23, 42, 0.4)',  // Slate-900 with opacity
  overlayLight: 'rgba(15, 23, 42, 0.1)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  
  // Matrix-specific colors (toned for light mode)
  matrix: {
    glow: '#10b981',            // Softer glow for light mode
    bright: '#34d399',
    dim: '#d1fae5',
  },
  
  // Chat colors for light mode
  chat: {
    bg: '#f8fafc',
    hover: '#f1f5f9',
    input: '#ffffff',
    bubbleSent: '#10b981',      // Primary color
    bubbleSentText: '#ffffff',
    bubbleReceived: '#f1f5f9',
    bubbleReceivedText: '#0f172a',
    timestamp: '#94a3b8',
  },
  
  // Sidebar colors for light mode
  sidebar: {
    bg: '#f1f5f9',
    hover: '#e2e8f0',
    active: '#d1fae5',          // Primary light
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
    online: '#22c55e',          // Green-500
    idle: '#eab308',            // Yellow-500
    dnd: '#ef4444',             // Red-500
    offline: '#94a3b8',         // Slate-400
    invisible: '#6b7280',       // Gray-500
  },
  
  // Gamification / Rarity colors
  rarity: {
    common: '#6b7280',          // Gray-500
    uncommon: '#22c55e',        // Green-500
    rare: '#3b82f6',            // Blue-500
    epic: '#a855f7',            // Purple-500
    legendary: '#f59e0b',       // Amber-500
    mythic: '#ec4899',          // Pink-500
    divine: '#f97316',          // Orange-500
  },
  
  // Premium / Gold accents
  premium: {
    gold: '#eab308',
    goldLight: '#fef3c7',
    goldDark: '#ca8a04',
  },
};

/**
 * Dark Theme - Discord-inspired with Matrix green accents
 * Optimized for late-night use and OLED screens
 */
const darkColors = {
  // Core backgrounds
  background: '#0f172a',        // Slate-900 (deeper than before)
  surface: '#1e293b',           // Slate-800
  surfaceSecondary: '#334155',  // Slate-700
  surfaceHover: '#475569',      // Slate-600
  surfaceElevated: '#1e293b',   // For modals/popovers
  
  // Primary brand colors - Matrix green
  primary: '#10b981',           // Emerald-500
  primaryHover: '#34d399',      // Emerald-400 (lighter on dark)
  primaryLight: '#064e3b',      // Emerald-900 - for dark backgrounds
  primaryMuted: '#047857',      // Emerald-700
  secondary: '#6ee7b7',         // Emerald-300
  accent: '#00ff41',            // Full Matrix glow
  
  // Text hierarchy
  text: '#f8fafc',              // Slate-50
  textSecondary: '#cbd5e1',     // Slate-300
  textTertiary: '#64748b',      // Slate-500
  textInverse: '#0f172a',       // For light backgrounds
  textLink: '#34d399',          // Emerald-400 for links
  
  // Borders and dividers
  border: '#334155',            // Slate-700
  borderLight: '#1e293b',       // Slate-800
  borderFocus: '#10b981',       // Primary color for focus states
  divider: '#334155',
  
  // Semantic colors
  error: '#f87171',             // Red-400 (lighter for dark mode)
  errorLight: '#450a0a',        // Red-950
  success: '#34d399',           // Emerald-400
  successLight: '#064e3b',      // Emerald-900
  warning: '#fbbf24',           // Amber-400
  warningLight: '#451a03',      // Amber-950
  info: '#60a5fa',              // Blue-400
  infoLight: '#1e3a5f',         // Blue-950
  
  // UI elements
  card: '#1e293b',
  cardHover: '#334155',
  input: '#334155',
  inputBorder: '#475569',       // Slate-600
  inputFocus: '#10b981',
  inputPlaceholder: '#64748b',  // Slate-500
  
  // Interactive states
  disabled: '#334155',
  disabledText: '#64748b',
  highlight: '#854d0e',         // Yellow-800 for search highlights
  selection: '#064e3b',         // Emerald-900
  
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
  
  // Chat colors matching web
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
  
  // Sidebar colors matching web
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
  
  // Status colors (same as light - already vibrant)
  status: {
    online: '#22c55e',
    idle: '#eab308',
    dnd: '#ef4444',
    offline: '#64748b',
    invisible: '#6b7280',
  },
  
  // Gamification / Rarity colors (brighter for dark mode)
  rarity: {
    common: '#9ca3af',          // Gray-400
    uncommon: '#4ade80',        // Green-400
    rare: '#60a5fa',            // Blue-400
    epic: '#c084fc',            // Purple-400
    legendary: '#fbbf24',       // Amber-400
    mythic: '#f472b6',          // Pink-400
    divine: '#fb923c',          // Orange-400
  },
  
  // Premium / Gold accents
  premium: {
    gold: '#fbbf24',
    goldLight: '#854d0e',
    goldDark: '#eab308',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cgraph_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  
  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
      if (value && ['light', 'dark', 'system'].includes(value)) {
        setThemePreferenceState(value as ThemePreference);
      }
    });
  }, []);
  
  const setThemePreference = async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
  };
  
  const colorScheme: ColorScheme = themePreference === 'system'
    ? (systemColorScheme || 'light')
    : themePreference;
  
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';
  
  return (
    <ThemeContext.Provider value={{ colorScheme, themePreference, setThemePreference, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export color types for TypeScript consumers
export type ThemeColors = typeof lightColors;
export type ColorSchemeType = ColorScheme;
export type ThemePreferenceType = ThemePreference;

// Export raw color palettes for direct access if needed
export { lightColors, darkColors };
