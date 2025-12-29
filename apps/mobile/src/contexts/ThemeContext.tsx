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

const lightColors = {
  background: '#ffffff',
  surface: '#f3f4f6',
  surfaceHover: '#e5e7eb',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  secondary: '#8b5cf6',
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
};

const darkColors = {
  background: '#111827',
  surface: '#1f2937',
  surfaceHover: '#374151',
  primary: '#6366f1',
  primaryHover: '#818cf8',
  secondary: '#8b5cf6',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  border: '#374151',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  card: '#1f2937',
  input: '#374151',
  overlay: 'rgba(0, 0, 0, 0.7)',
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
