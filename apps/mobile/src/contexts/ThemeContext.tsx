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
}

// Matrix-inspired green palette matching web theme
const lightColors = {
  background: '#ffffff',
  surface: '#f3f4f6',
  surfaceSecondary: '#e5e7eb',
  surfaceHover: '#d1fae5',
  primary: '#10b981',        // Emerald-500 - Matrix green
  primaryHover: '#059669',   // Emerald-600
  secondary: '#047857',      // Emerald-700
  accent: '#00ff41',         // Matrix glow
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  card: '#ffffff',
  input: '#f9fafb',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Matrix-specific colors
  matrix: {
    glow: '#00ff41',
    bright: '#39ff14',
    dim: '#003b00',
  },
};

// Discord-inspired dark theme with Matrix green accents
const darkColors = {
  background: '#111827',     // Dark-900
  surface: '#1f2937',        // Dark-800
  surfaceSecondary: '#374151', // Dark-700
  surfaceHover: '#2f3136',   // Sidebar background
  primary: '#10b981',        // Emerald-500 - Matrix green
  primaryHover: '#34d399',   // Emerald-400
  secondary: '#047857',      // Emerald-700
  accent: '#00ff41',         // Matrix glow
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  border: '#374151',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  card: '#1f2937',
  input: '#40444b',          // Chat input background
  overlay: 'rgba(0, 0, 0, 0.7)',
  // Matrix-specific colors
  matrix: {
    glow: '#00ff41',
    bright: '#39ff14',
    dim: '#003b00',
  },
  // Chat colors matching web
  chat: {
    bg: '#36393f',
    hover: '#32353b',
    input: '#40444b',
  },
  // Sidebar colors matching web
  sidebar: {
    bg: '#2f3136',
    hover: '#34373c',
    active: '#393c43',
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
  
  return (
    <ThemeContext.Provider value={{ colorScheme, themePreference, setThemePreference, colors }}>
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
