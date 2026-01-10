/**
 * Enhanced Theme Context
 * 
 * React context provider for the CGraph theming system.
 * Provides theme state, settings, and utilities to all components.
 * 
 * Features:
 * - Full theme object access
 * - Settings management (font scale, message density, etc.)
 * - System preference detection
 * - Real-time theme switching
 * - Cross-tab synchronization
 * 
 * @version 4.0.0
 * @since v0.7.36
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';

import {
  Theme,
  ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/ThemeEngine';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface ThemeContextValue {
  /** Current active theme */
  theme: Theme;
  
  /** Current theme preferences */
  preferences: ThemePreferences;
  
  /** All available themes */
  availableThemes: Theme[];
  
  /** Whether system preference is being used */
  isSystemPreference: boolean;
  
  /** Resolved base theme (dark or light) */
  resolvedBaseTheme: 'dark' | 'light';
  
  /** Set active theme by ID */
  setTheme: (themeId: string) => void;
  
  /** Update theme settings */
  updateSettings: (settings: Partial<ThemePreferences['settings']>) => void;
  
  /** Toggle between dark and light themes */
  toggleDarkMode: () => void;
  
  /** Set font scale (0.8 - 1.4) */
  setFontScale: (scale: number) => void;
  
  /** Set message display mode */
  setMessageDisplay: (mode: 'cozy' | 'compact') => void;
  
  /** Set message spacing (0.5 - 2) */
  setMessageSpacing: (spacing: number) => void;
  
  /** Toggle reduced motion */
  toggleReduceMotion: () => void;
  
  /** Toggle high contrast mode */
  toggleHighContrast: () => void;
  
  /** Toggle system preference respect */
  toggleSystemPreference: () => void;
  
  /** Create a custom theme */
  createCustomTheme: (theme: Omit<Theme, 'isBuiltIn'>) => Theme;
  
  /** Delete a custom theme */
  deleteCustomTheme: (themeId: string) => boolean;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const ThemeContextEnhanced = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface ThemeProviderEnhancedProps {
  children: ReactNode;
  /** Initial theme ID (optional) */
  initialTheme?: string;
}

export function ThemeProviderEnhanced({
  children,
  initialTheme,
}: ThemeProviderEnhancedProps) {
  const [theme, setThemeState] = useState<Theme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() => 
    themeEngine.getPreferences()
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
  const setFontScale = useCallback((scale: number) => {
    const clampedScale = Math.max(0.8, Math.min(1.4, scale));
    updateSettings({ fontScale: clampedScale });
  }, [updateSettings]);
  
  // Set message display
  const setMessageDisplay = useCallback((mode: 'cozy' | 'compact') => {
    updateSettings({ messageDisplay: mode });
  }, [updateSettings]);
  
  // Set message spacing
  const setMessageSpacing = useCallback((spacing: number) => {
    const clampedSpacing = Math.max(0.5, Math.min(2, spacing));
    updateSettings({ messageSpacing: clampedSpacing });
  }, [updateSettings]);
  
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
  
  const value = useMemo<ThemeContextValue>(() => ({
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
  }), [
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
  ]);
  
  return (
    <ThemeContextEnhanced.Provider value={value}>
      {children}
    </ThemeContextEnhanced.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProviderEnhanced.
 */
export function useThemeEnhanced(): ThemeContextValue {
  const context = useContext(ThemeContextEnhanced);
  
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
  
  return useMemo(() => ({
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
  }), [theme]);
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
