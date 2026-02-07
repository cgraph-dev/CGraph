/**
 * CGraph Theme Engine
 *
 * Core logic for theme application, persistence, and cross-tab sync.
 * Types are in ./types.ts, theme definitions in ./themes.ts.
 *
 * @version 4.0.0
 * @since v0.7.36
 */

import { createLogger } from '@/lib/logger';
import type { Theme, ThemePreferences } from './types';
import { THEME_DARK, THEME_REGISTRY } from './themes';

// Re-export everything for backward compatibility
export type {
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeAnimations,
  Theme,
  ThemePreferences,
} from './types';
export {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ANIMATIONS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_MATRIX,
  THEME_HOLO_CYAN,
  THEME_HOLO_PURPLE,
  THEME_HOLO_GOLD,
  THEME_MIDNIGHT,
  THEME_REGISTRY,
} from './themes';

const logger = createLogger('ThemeEngine');

// =============================================================================
// THEME ENGINE CLASS
// =============================================================================

const STORAGE_KEY = 'cgraph-theme-preferences';
const BROADCAST_CHANNEL = 'cgraph-theme-sync';

/**
 * ThemeEngine handles all theme-related operations including:
 * - Theme application and CSS variable injection
 * - User preferences persistence
 * - Cross-tab synchronization
 * - Accessibility adjustments
 */
class ThemeEngineImpl {
  private currentTheme: Theme = THEME_DARK;
  private preferences: ThemePreferences;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.preferences = this.loadPreferences();
    this.initBroadcastChannel();
    this.applyTheme(this.getActiveTheme());
  }

  /**
   * Load user preferences from localStorage.
   */
  private loadPreferences(): ThemePreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ThemePreferences;
        return { ...this.getDefaultPreferences(), ...parsed };
      }
    } catch (error) {
      logger.error('Failed to load preferences:', error);
    }

    return this.getDefaultPreferences();
  }

  /**
   * Get default preferences.
   */
  private getDefaultPreferences(): ThemePreferences {
    return {
      activeThemeId: 'dark',
      customThemes: [],
      settings: {
        syncAcrossDevices: false,
        respectSystemPreference: false,
        messageDisplay: 'cozy',
        fontScale: 1,
        messageSpacing: 1,
        reduceMotion: false,
        highContrast: false,
        backgroundEffect: 'none',
        shaderVariant: 'matrix',
        backgroundIntensity: 0.6,
      },
    };
  }

  /**
   * Save preferences to localStorage.
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      logger.error('Failed to save preferences:', error);
    }
  }

  /**
   * Initialize broadcast channel for cross-tab synchronization.
   */
  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'theme-change') {
          this.applyTheme(event.data.theme, false);
        }
      };
    } catch (error) {
      logger.error('Failed to initialize broadcast channel:', error);
    }
  }

  /**
   * Get the currently active theme.
   */
  getActiveTheme(): Theme {
    // Check for system preference if enabled
    if (this.preferences.settings.respectSystemPreference && typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemThemeId = prefersDark ? 'dark' : 'light';
      return THEME_REGISTRY[systemThemeId] ?? THEME_DARK;
    }

    // Check custom themes first
    const customTheme = this.preferences.customThemes.find(
      (t) => t.id === this.preferences.activeThemeId
    );
    if (customTheme) return customTheme;

    // Check built-in themes
    return THEME_REGISTRY[this.preferences.activeThemeId] ?? THEME_DARK;
  }

  /**
   * Apply a theme to the document.
   */
  applyTheme(theme: Theme, broadcast = true): void {
    this.currentTheme = theme;
    this.preferences.activeThemeId = theme.id;

    if (typeof document !== 'undefined') {
      this.injectCSSVariables(theme);
      this.updateDocumentClasses(theme);
    }

    this.savePreferences();

    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'theme-change', theme });
    }

    this.notifyListeners(theme);
  }

  /**
   * Inject CSS variables into the document root.
   */
  private injectCSSVariables(theme: Theme): void {
    const root = document.documentElement;
    const { colors, typography, spacing, animations } = theme;
    const { settings } = this.preferences;

    // Apply font scale
    const scaledFontSize = (size: string) => {
      const value = parseFloat(size);
      return `${value * settings.fontScale}px`;
    };

    // Color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Typography variables
    root.style.setProperty('--font-family', typography.fontFamily);
    root.style.setProperty('--font-family-mono', typography.fontFamilyMono);
    root.style.setProperty('--font-size-base', scaledFontSize(typography.fontSizeBase));
    root.style.setProperty('--font-size-sm', scaledFontSize(typography.fontSizeSmall));
    root.style.setProperty('--font-size-lg', scaledFontSize(typography.fontSizeLarge));
    root.style.setProperty('--font-size-xl', scaledFontSize(typography.fontSizeXL));
    root.style.setProperty('--font-size-xxl', scaledFontSize(typography.fontSizeXXL));
    root.style.setProperty('--line-height-normal', typography.lineHeightNormal);
    root.style.setProperty('--line-height-tight', typography.lineHeightTight);
    root.style.setProperty('--line-height-loose', typography.lineHeightLoose);

    // Spacing variables
    root.style.setProperty('--spacing-unit', `${spacing.unit}px`);
    root.style.setProperty('--spacing-xs', spacing.xs);
    root.style.setProperty('--spacing-sm', spacing.sm);
    root.style.setProperty('--spacing-md', spacing.md);
    root.style.setProperty('--spacing-lg', spacing.lg);
    root.style.setProperty('--spacing-xl', spacing.xl);
    root.style.setProperty('--spacing-xxl', spacing.xxl);
    root.style.setProperty('--border-radius', spacing.borderRadius);
    root.style.setProperty('--border-radius-lg', spacing.borderRadiusLarge);
    root.style.setProperty('--border-radius-full', spacing.borderRadiusFull);

    // Animation variables
    root.style.setProperty('--duration-fast', animations.durationFast);
    root.style.setProperty('--duration-normal', animations.durationNormal);
    root.style.setProperty('--duration-slow', animations.durationSlow);
    root.style.setProperty('--easing-default', animations.easingDefault);
    root.style.setProperty('--easing-emphasized', animations.easingEmphasized);

    // Message spacing
    root.style.setProperty('--message-spacing', `${16 * settings.messageSpacing}px`);
  }

  /**
   * Update document classes based on theme.
   */
  private updateDocumentClasses(theme: Theme): void {
    const root = document.documentElement;
    const { settings } = this.preferences;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'theme-matrix', 'theme-holo', 'theme-special');

    // Add category class
    if (theme.category === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }

    // Add special theme classes
    if (theme.id === 'matrix') {
      root.classList.add('theme-matrix');
    } else if (theme.id.startsWith('holo-')) {
      root.classList.add('theme-holo');
    }
    if (theme.category === 'special') {
      root.classList.add('theme-special');
    }

    // Accessibility classes
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Message display
    root.classList.remove('message-cozy', 'message-compact');
    root.classList.add(`message-${settings.messageDisplay}`);
  }

  /**
   * Set the active theme by ID.
   */
  setTheme(themeId: string): void {
    const theme =
      THEME_REGISTRY[themeId] ?? this.preferences.customThemes.find((t) => t.id === themeId);

    if (theme) {
      this.applyTheme(theme);
    } else {
      logger.error(`Theme "${themeId}" not found`);
    }
  }

  /**
   * Update theme settings.
   */
  updateSettings(settings: Partial<ThemePreferences['settings']>): void {
    this.preferences.settings = { ...this.preferences.settings, ...settings };
    this.savePreferences();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get all available themes.
   */
  getAllThemes(): Theme[] {
    return [...Object.values(THEME_REGISTRY), ...this.preferences.customThemes];
  }

  /**
   * Get themes by category.
   */
  getThemesByCategory(category: Theme['category']): Theme[] {
    return this.getAllThemes().filter((t) => t.category === category);
  }

  /**
   * Create a custom theme.
   */
  createCustomTheme(theme: Omit<Theme, 'isBuiltIn'>): Theme {
    const newTheme: Theme = {
      ...theme,
      isBuiltIn: false,
      metadata: {
        ...theme.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Remove existing theme with same ID
    this.preferences.customThemes = this.preferences.customThemes.filter(
      (t) => t.id !== newTheme.id
    );

    this.preferences.customThemes.push(newTheme);
    this.savePreferences();

    return newTheme;
  }

  /**
   * Delete a custom theme.
   */
  deleteCustomTheme(themeId: string): boolean {
    const initialLength = this.preferences.customThemes.length;
    this.preferences.customThemes = this.preferences.customThemes.filter((t) => t.id !== themeId);

    if (this.preferences.customThemes.length < initialLength) {
      // If active theme was deleted, switch to default
      if (this.preferences.activeThemeId === themeId) {
        this.setTheme('dark');
      }
      this.savePreferences();
      return true;
    }

    return false;
  }

  /**
   * Get current theme.
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get current preferences.
   */
  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  /**
   * Subscribe to theme changes.
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of theme change.
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach((listener) => {
      try {
        listener(theme);
      } catch (error) {
        logger.error('Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const themeEngine = new ThemeEngineImpl();

// Export convenience functions
export const setTheme = (themeId: string) => themeEngine.setTheme(themeId);
export const getCurrentTheme = () => themeEngine.getCurrentTheme();
export const getAllThemes = () => themeEngine.getAllThemes();
export const getThemeById = (themeId: string): Theme | undefined => THEME_REGISTRY[themeId];
export const subscribeToTheme = (listener: (theme: Theme) => void) =>
  themeEngine.subscribe(listener);
