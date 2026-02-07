/**
 * Theme System Type Definitions
 *
 * Interfaces for colors, typography, spacing, animations,
 * complete theme structure, and user preferences.
 *
 * @module lib/theme/types
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
