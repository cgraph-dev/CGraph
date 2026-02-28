/**
 * Unified Theme Context — single ThemeProvider for the whole app.
 *
 * Merges the legacy basic ThemeProvider (light/dark/system detection +
 * CSS class toggle) with ThemeProviderEnhanced (CSS-variable injection,
 * 7+ theme support, preferences persistence, accessibility settings).
 *
 * Consumers can use:
 *   - `useTheme()`         — simple API: { theme, resolvedTheme, setTheme }
 *   - `useThemeEnhanced()` — full API: theme object, preferences, all setters
 *
 * Both hooks read from the same provider.  Only ONE <ThemeProvider> is needed
 * in the component tree (wrapping <App> in main.tsx).
 *
 * @module contexts/theme-context
 */
import {
  createContext,
  use,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type Theme as FullTheme,
  type ThemePreferences,
  themeEngine,
  getAllThemes,
  THEME_REGISTRY,
} from '@/lib/theme/theme-engine';
import { injectSemanticTokens } from '@/lib/theme/tokens';
import type { ThemeContextValue } from '@/contexts/theme-enhanced/types';
import { ThemeContextEnhanced } from '@/contexts/theme-enhanced/hooks';

// ---------------------------------------------------------------------------
// Simple theme context (backward-compat API)
// ---------------------------------------------------------------------------

type SimpleTheme = 'dark' | 'light' | 'system';

interface SimpleThemeContextType {
  theme: SimpleTheme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: SimpleTheme) => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Unified Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
  /** Optional initial theme ID */
  initialTheme?: string;
}

/**
 * Unified ThemeProvider — single provider for the whole app.
 *
 * Delegates theme application to the ThemeEngine singleton, which handles:
 * - CSS variable injection (colors, typography, spacing)
 * - Document class management (light/dark, theme-matrix, etc.)
 * - Preference persistence (localStorage + BroadcastChannel)
 *
 * Additionally injects semantic design tokens from tokens.ts.
 */
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // --- Enhanced state (from ThemeEngine) ---
  const [theme, setThemeState] = useState<FullTheme>(() => themeEngine.getCurrentTheme());
  const [preferences, setPreferences] = useState<ThemePreferences>(() =>
    themeEngine.getPreferences()
  );

  // Subscribe to theme engine changes
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

  // Inject semantic design tokens whenever theme changes
  useEffect(() => {
    injectSemanticTokens(theme.id);
  }, [theme.id]);

  // --- System preference listener ---
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

  // --- Reduced motion listener ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (mediaQuery.matches) themeEngine.updateSettings({ reduceMotion: true });
    };
    if (mediaQuery.matches) handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- Enhanced API callbacks ---
  const setTheme = useCallback((themeId: string) => themeEngine.setTheme(themeId), []);

  const updateSettings = useCallback((settings: Partial<ThemePreferences['settings']>) => {
    themeEngine.updateSettings(settings);
    setPreferences(themeEngine.getPreferences());
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newId = theme.category === 'dark' ? 'light' : 'dark';
    themeEngine.setTheme(newId);
  }, [theme.category]);

  const setFontScale = useCallback(
    (scale: number) => updateSettings({ fontScale: Math.max(0.8, Math.min(1.4, scale)) }),
    [updateSettings]
  );
  const setMessageDisplay = useCallback(
    (mode: 'cozy' | 'compact') => updateSettings({ messageDisplay: mode }),
    [updateSettings]
  );
  const setMessageSpacing = useCallback(
    (spacing: number) => updateSettings({ messageSpacing: Math.max(0.5, Math.min(2, spacing)) }),
    [updateSettings]
  );
  const toggleReduceMotion = useCallback(
    () => updateSettings({ reduceMotion: !preferences.settings.reduceMotion }),
    [preferences.settings.reduceMotion, updateSettings]
  );
  const toggleHighContrast = useCallback(
    () => updateSettings({ highContrast: !preferences.settings.highContrast }),
    [preferences.settings.highContrast, updateSettings]
  );
  const toggleSystemPreference = useCallback(
    () =>
      updateSettings({ respectSystemPreference: !preferences.settings.respectSystemPreference }),
    [preferences.settings.respectSystemPreference, updateSettings]
  );

  const createCustomTheme = useCallback((newTheme: Omit<FullTheme, 'isBuiltIn'>): FullTheme => {
    const created = themeEngine.createCustomTheme(newTheme);
    setPreferences(themeEngine.getPreferences());
    return created;
  }, []);

  const deleteCustomTheme = useCallback((themeId: string): boolean => {
    const result = themeEngine.deleteCustomTheme(themeId);
    if (result) setPreferences(themeEngine.getPreferences());
    return result;
  }, []);

  const isSystemPreference = preferences.settings.respectSystemPreference;
  const resolvedBaseTheme: 'dark' | 'light' = theme.category === 'light' ? 'light' : 'dark';
  const availableThemes = useMemo(() => getAllThemes(), [preferences.customThemes]);

  // Enhanced context value
  const enhancedValue = useMemo<ThemeContextValue>(
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
    ]
  );

  // --- Simple context value (backward-compat) ---
  const simpleTheme: SimpleTheme = isSystemPreference ? 'system' : resolvedBaseTheme;

  const setSimpleTheme = useCallback(
    (t: SimpleTheme) => {
      if (t === 'system') {
        updateSettings({ respectSystemPreference: true });
        const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        themeEngine.setTheme(sys);
      } else {
        updateSettings({ respectSystemPreference: false });
        themeEngine.setTheme(t);
      }
    },
    [updateSettings]
  );

  const simpleValue = useMemo<SimpleThemeContextType>(
    () => ({ theme: simpleTheme, resolvedTheme: resolvedBaseTheme, setTheme: setSimpleTheme }),
    [simpleTheme, resolvedBaseTheme, setSimpleTheme]
  );

  return (
    <SimpleThemeContext.Provider value={simpleValue}>
      <ThemeContextEnhanced.Provider value={enhancedValue}>
        {children}
      </ThemeContextEnhanced.Provider>
    </SimpleThemeContext.Provider>
  );
}

/**
 * Simple theme hook — backward-compatible API.
 * Returns { theme, resolvedTheme, setTheme } where theme is 'dark' | 'light' | 'system'.
 */
export function useTheme(): SimpleThemeContextType {
  const context = use(SimpleThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
