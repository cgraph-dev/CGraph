/**
 * CGraph Theme Engine
 * 
 * Comprehensive theming system providing:
 * - Multiple preset themes (dark, light, matrix, holographic, etc.)
 * - Custom theme creation with full color control
 * - User preferences persistence via localStorage
 * - CSS variable injection for real-time updates
 * - Accessibility compliance (WCAG 2.1 AA contrast ratios)
 * - Theme synchronization across browser tabs
 * 
 * Architecture:
 * - ThemeRegistry: Central store for all available themes
 * - ThemeProvider: React context for theme distribution
 * - ThemeEngine: Core logic for theme application and persistence
 * 
 * @version 4.0.0
 * @since v0.7.36
 * @author CGraph Development Team
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Core color palette structure for themes.
 * Each color serves a specific semantic purpose in the UI.
 */
export interface ThemeColors {
  /** Primary brand color - used for main actions and highlights */
  primary: string;
  /** Lighter variant of primary for hover states */
  primaryLight: string;
  /** Darker variant of primary for pressed states */
  primaryDark: string;
  
  /** Secondary accent color for supplementary elements */
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  /** Accent color for highlighting and emphasis */
  accent: string;
  accentLight: string;
  accentDark: string;
  
  /** Background colors for different elevation levels */
  background: string;
  backgroundElevated: string;
  backgroundSunken: string;
  
  /** Surface colors for cards, modals, and overlays */
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;
  
  /** Text colors for different contexts */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  /** Semantic colors for status indicators */
  success: string;
  warning: string;
  error: string;
  info: string;
  
  /** Interactive element colors */
  link: string;
  linkHover: string;
  
  /** Glow and shadow colors for effects */
  glow: string;
  shadow: string;
  
  /** Holographic-specific colors */
  holoPrimary: string;
  holoSecondary: string;
  holoAccent: string;
  holoGlow: string;
  holoScanline: string;
  holoBackground: string;
}

/**
 * Typography configuration for themes.
 */
export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeBase: string;
  fontSizeSmall: string;
  fontSizeLarge: string;
  fontSizeXL: string;
  fontSizeXXL: string;
  lineHeightNormal: string;
  lineHeightTight: string;
  lineHeightLoose: string;
}

/**
 * Spacing and sizing configuration.
 */
export interface ThemeSpacing {
  unit: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  borderRadius: string;
  borderRadiusLarge: string;
  borderRadiusFull: string;
}

/**
 * Animation and transition configuration.
 */
export interface ThemeAnimations {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easingDefault: string;
  easingEmphasized: string;
  enableMotion: boolean;
  enableGlow: boolean;
  enableScanlines: boolean;
  enableFlicker: boolean;
  enableParallax: boolean;
}

/**
 * Complete theme definition.
 */
export interface Theme {
  id: string;
  name: string;
  description: string;
  category: 'light' | 'dark' | 'special';
  isBuiltIn: boolean;
  isPremium: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  animations: ThemeAnimations;
  metadata: {
    author: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * User theme preferences stored in localStorage.
 */
export interface ThemePreferences {
  activeThemeId: string;
  customThemes: Theme[];
  settings: {
    syncAcrossDevices: boolean;
    respectSystemPreference: boolean;
    messageDisplay: 'cozy' | 'compact';
    fontScale: number;
    messageSpacing: number;
    reduceMotion: boolean;
    highContrast: boolean;
    /** Background effect: none, shader, matrix3d */
    backgroundEffect: 'none' | 'shader' | 'matrix3d';
    /** Shader variant when backgroundEffect is 'shader' */
    shaderVariant: 'matrix' | 'fluid' | 'particles' | 'waves' | 'neural';
    /** Background effect intensity (0.0 - 1.0) */
    backgroundIntensity: number;
  };
}

// =============================================================================
// DEFAULT TYPOGRAPHY AND SPACING
// =============================================================================

const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  fontSizeBase: '14px',
  fontSizeSmall: '12px',
  fontSizeLarge: '16px',
  fontSizeXL: '20px',
  fontSizeXXL: '28px',
  lineHeightNormal: '1.5',
  lineHeightTight: '1.25',
  lineHeightLoose: '1.75',
};

const DEFAULT_SPACING: ThemeSpacing = {
  unit: 4,
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  borderRadius: '8px',
  borderRadiusLarge: '12px',
  borderRadiusFull: '9999px',
};

const DEFAULT_ANIMATIONS: ThemeAnimations = {
  durationFast: '150ms',
  durationNormal: '250ms',
  durationSlow: '400ms',
  easingDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  enableMotion: true,
  enableGlow: true,
  enableScanlines: false,
  enableFlicker: false,
  enableParallax: true,
};

// =============================================================================
// BUILT-IN THEMES
// =============================================================================

/**
 * Dark theme - Default CGraph experience
 */
export const THEME_DARK: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Default dark theme optimized for low-light environments',
  category: 'dark',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    secondaryLight: '#a78bfa',
    secondaryDark: '#7c3aed',
    accent: '#22d3ee',
    accentLight: '#67e8f9',
    accentDark: '#06b6d4',
    background: '#0f0f0f',
    backgroundElevated: '#171717',
    backgroundSunken: '#0a0a0a',
    surface: '#1f1f1f',
    surfaceElevated: '#2a2a2a',
    surfaceBorder: '#333333',
    textPrimary: '#ffffff',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    textInverse: '#0f0f0f',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    link: '#6366f1',
    linkHover: '#818cf8',
    glow: 'rgba(99, 102, 241, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    holoPrimary: 'rgba(99, 102, 241, 0.9)',
    holoSecondary: 'rgba(139, 92, 246, 0.7)',
    holoAccent: 'rgba(34, 211, 238, 1)',
    holoGlow: 'rgba(99, 102, 241, 0.5)',
    holoScanline: 'rgba(99, 102, 241, 0.1)',
    holoBackground: 'rgba(15, 15, 15, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: DEFAULT_ANIMATIONS,
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Light theme - Clean light interface
 */
export const THEME_LIGHT: Theme = {
  id: 'light',
  name: 'Light',
  description: 'Clean light theme for well-lit environments',
  category: 'light',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    primaryDark: '#4338ca',
    secondary: '#7c3aed',
    secondaryLight: '#8b5cf6',
    secondaryDark: '#6d28d9',
    accent: '#0891b2',
    accentLight: '#06b6d4',
    accentDark: '#0e7490',
    background: '#ffffff',
    backgroundElevated: '#f9fafb',
    backgroundSunken: '#f3f4f6',
    surface: '#ffffff',
    surfaceElevated: '#f9fafb',
    surfaceBorder: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    textInverse: '#ffffff',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
    link: '#4f46e5',
    linkHover: '#6366f1',
    glow: 'rgba(79, 70, 229, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    holoPrimary: 'rgba(79, 70, 229, 0.9)',
    holoSecondary: 'rgba(124, 58, 237, 0.7)',
    holoAccent: 'rgba(8, 145, 178, 1)',
    holoGlow: 'rgba(79, 70, 229, 0.3)',
    holoScanline: 'rgba(79, 70, 229, 0.05)',
    holoBackground: 'rgba(255, 255, 255, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: { ...DEFAULT_ANIMATIONS, enableGlow: false },
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Matrix theme - Iconic green-on-black cyberpunk aesthetic
 */
export const THEME_MATRIX: Theme = {
  id: 'matrix',
  name: 'Matrix',
  description: 'Iconic green-on-black cyberpunk aesthetic inspired by the Matrix',
  category: 'special',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#00ff41',
    primaryLight: '#39ff14',
    primaryDark: '#00cc33',
    secondary: '#00ff88',
    secondaryLight: '#33ffaa',
    secondaryDark: '#00cc66',
    accent: '#00ffff',
    accentLight: '#66ffff',
    accentDark: '#00cccc',
    background: '#000000',
    backgroundElevated: '#0a0f0a',
    backgroundSunken: '#000000',
    surface: '#0d1a0d',
    surfaceElevated: '#132513',
    surfaceBorder: '#1a3a1a',
    textPrimary: '#00ff41',
    textSecondary: '#00cc33',
    textMuted: '#008822',
    textInverse: '#000000',
    success: '#00ff41',
    warning: '#ffff00',
    error: '#ff0040',
    info: '#00ffff',
    link: '#00ff41',
    linkHover: '#39ff14',
    glow: 'rgba(0, 255, 65, 0.5)',
    shadow: 'rgba(0, 255, 65, 0.2)',
    holoPrimary: 'rgba(0, 255, 65, 0.9)',
    holoSecondary: 'rgba(0, 255, 136, 0.7)',
    holoAccent: 'rgba(57, 255, 20, 1)',
    holoGlow: 'rgba(0, 255, 65, 0.5)',
    holoScanline: 'rgba(0, 255, 65, 0.15)',
    holoBackground: 'rgba(0, 10, 0, 0.95)',
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
  },
  spacing: DEFAULT_SPACING,
  animations: {
    ...DEFAULT_ANIMATIONS,
    enableScanlines: true,
    enableFlicker: true,
    enableGlow: true,
  },
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Holographic Cyan theme - Futuristic sci-fi interface
 */
export const THEME_HOLO_CYAN: Theme = {
  id: 'holo-cyan',
  name: 'Holographic Cyan',
  description: 'Futuristic sci-fi interface with cyan holographic effects',
  category: 'special',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#00d4ff',
    primaryLight: '#4de4ff',
    primaryDark: '#00a8cc',
    secondary: '#00c8ff',
    secondaryLight: '#66daff',
    secondaryDark: '#009fcc',
    accent: '#00ffff',
    accentLight: '#80ffff',
    accentDark: '#00cccc',
    background: '#001420',
    backgroundElevated: '#002030',
    backgroundSunken: '#000a10',
    surface: '#002838',
    surfaceElevated: '#003848',
    surfaceBorder: '#004860',
    textPrimary: '#00ffff',
    textSecondary: '#00cccc',
    textMuted: '#009999',
    textInverse: '#001420',
    success: '#00ff88',
    warning: '#ffcc00',
    error: '#ff4466',
    info: '#00d4ff',
    link: '#00d4ff',
    linkHover: '#4de4ff',
    glow: 'rgba(0, 212, 255, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    holoPrimary: 'rgba(0, 255, 255, 0.9)',
    holoSecondary: 'rgba(0, 200, 255, 0.7)',
    holoAccent: 'rgba(100, 255, 255, 1)',
    holoGlow: 'rgba(0, 255, 255, 0.5)',
    holoScanline: 'rgba(0, 255, 255, 0.1)',
    holoBackground: 'rgba(0, 20, 40, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: {
    ...DEFAULT_ANIMATIONS,
    enableScanlines: true,
    enableFlicker: true,
    enableGlow: true,
    enableParallax: true,
  },
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Holographic Purple theme - Violet cyberpunk aesthetic
 */
export const THEME_HOLO_PURPLE: Theme = {
  id: 'holo-purple',
  name: 'Holographic Purple',
  description: 'Violet cyberpunk aesthetic with purple holographic effects',
  category: 'special',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#c850ff',
    primaryLight: '#d980ff',
    primaryDark: '#a040cc',
    secondary: '#9633ff',
    secondaryLight: '#b366ff',
    secondaryDark: '#7a29cc',
    accent: '#e066ff',
    accentLight: '#eb99ff',
    accentDark: '#cc33ff',
    background: '#120820',
    backgroundElevated: '#1e1030',
    backgroundSunken: '#0a0410',
    surface: '#251838',
    surfaceElevated: '#322048',
    surfaceBorder: '#402860',
    textPrimary: '#e0b0ff',
    textSecondary: '#c080e0',
    textMuted: '#9060a0',
    textInverse: '#120820',
    success: '#66ff99',
    warning: '#ffcc00',
    error: '#ff4466',
    info: '#66ccff',
    link: '#c850ff',
    linkHover: '#d980ff',
    glow: 'rgba(200, 80, 255, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    holoPrimary: 'rgba(200, 100, 255, 0.9)',
    holoSecondary: 'rgba(150, 50, 255, 0.7)',
    holoAccent: 'rgba(220, 150, 255, 1)',
    holoGlow: 'rgba(180, 80, 255, 0.5)',
    holoScanline: 'rgba(180, 80, 255, 0.1)',
    holoBackground: 'rgba(30, 10, 50, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: {
    ...DEFAULT_ANIMATIONS,
    enableScanlines: true,
    enableFlicker: true,
    enableGlow: true,
    enableParallax: true,
  },
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Holographic Gold theme - Luxurious amber aesthetic
 */
export const THEME_HOLO_GOLD: Theme = {
  id: 'holo-gold',
  name: 'Holographic Gold',
  description: 'Luxurious amber aesthetic with golden holographic effects',
  category: 'special',
  isBuiltIn: true,
  isPremium: true,
  colors: {
    primary: '#ffc832',
    primaryLight: '#ffd966',
    primaryDark: '#cc9f28',
    secondary: '#ffb41e',
    secondaryLight: '#ffc74e',
    secondaryDark: '#cc9018',
    accent: '#ffdc64',
    accentLight: '#ffe898',
    accentDark: '#e6c45a',
    background: '#141008',
    backgroundElevated: '#201810',
    backgroundSunken: '#0a0804',
    surface: '#282010',
    surfaceElevated: '#342818',
    surfaceBorder: '#443820',
    textPrimary: '#ffe0a0',
    textSecondary: '#d4b060',
    textMuted: '#a08040',
    textInverse: '#141008',
    success: '#66ff99',
    warning: '#ffc832',
    error: '#ff4466',
    info: '#66ccff',
    link: '#ffc832',
    linkHover: '#ffd966',
    glow: 'rgba(255, 200, 50, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    holoPrimary: 'rgba(255, 200, 50, 0.9)',
    holoSecondary: 'rgba(255, 180, 30, 0.7)',
    holoAccent: 'rgba(255, 220, 100, 1)',
    holoGlow: 'rgba(255, 200, 50, 0.5)',
    holoScanline: 'rgba(255, 200, 50, 0.1)',
    holoBackground: 'rgba(40, 30, 10, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: {
    ...DEFAULT_ANIMATIONS,
    enableScanlines: true,
    enableFlicker: true,
    enableGlow: true,
    enableParallax: true,
  },
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

/**
 * Midnight Blue theme - Deep navy aesthetic
 */
export const THEME_MIDNIGHT: Theme = {
  id: 'midnight',
  name: 'Midnight Blue',
  description: 'Deep navy aesthetic for focused work sessions',
  category: 'dark',
  isBuiltIn: true,
  isPremium: false,
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#6366f1',
    secondaryLight: '#818cf8',
    secondaryDark: '#4f46e5',
    accent: '#0ea5e9',
    accentLight: '#38bdf8',
    accentDark: '#0284c7',
    background: '#0c1222',
    backgroundElevated: '#121c32',
    backgroundSunken: '#080e1a',
    surface: '#162236',
    surfaceElevated: '#1e2c44',
    surfaceBorder: '#293a54',
    textPrimary: '#f0f4fc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#0c1222',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    link: '#3b82f6',
    linkHover: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.4)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    holoPrimary: 'rgba(59, 130, 246, 0.9)',
    holoSecondary: 'rgba(99, 102, 241, 0.7)',
    holoAccent: 'rgba(14, 165, 233, 1)',
    holoGlow: 'rgba(59, 130, 246, 0.5)',
    holoScanline: 'rgba(59, 130, 246, 0.1)',
    holoBackground: 'rgba(12, 18, 34, 0.95)',
  },
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  animations: DEFAULT_ANIMATIONS,
  metadata: {
    author: 'CGraph',
    version: '4.0.0',
    createdAt: '2024-01-01',
    updatedAt: '2026-01-10',
  },
};

// =============================================================================
// THEME REGISTRY
// =============================================================================

/**
 * Central registry of all available themes.
 */
export const THEME_REGISTRY: Record<string, Theme> = {
  dark: THEME_DARK,
  light: THEME_LIGHT,
  matrix: THEME_MATRIX,
  'holo-cyan': THEME_HOLO_CYAN,
  'holo-purple': THEME_HOLO_PURPLE,
  'holo-gold': THEME_HOLO_GOLD,
  midnight: THEME_MIDNIGHT,
};

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
      console.error('[ThemeEngine] Failed to load preferences:', error);
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
      console.error('[ThemeEngine] Failed to save preferences:', error);
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
      console.error('[ThemeEngine] Failed to initialize broadcast channel:', error);
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
      t => t.id === this.preferences.activeThemeId
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
    const theme = THEME_REGISTRY[themeId] ?? 
                  this.preferences.customThemes.find(t => t.id === themeId);
    
    if (theme) {
      this.applyTheme(theme);
    } else {
      console.error(`[ThemeEngine] Theme "${themeId}" not found`);
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
    return [
      ...Object.values(THEME_REGISTRY),
      ...this.preferences.customThemes,
    ];
  }
  
  /**
   * Get themes by category.
   */
  getThemesByCategory(category: Theme['category']): Theme[] {
    return this.getAllThemes().filter(t => t.category === category);
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
      t => t.id !== newTheme.id
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
    this.preferences.customThemes = this.preferences.customThemes.filter(
      t => t.id !== themeId
    );
    
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
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.error('[ThemeEngine] Listener error:', error);
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
export const subscribeToTheme = (listener: (theme: Theme) => void) => themeEngine.subscribe(listener);
