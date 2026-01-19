/**
 * Global Theme System - Type Definitions
 *
 * Modular, scalable theme architecture supporting unlimited themes
 * Each theme can completely transform the UI while preserving user customizations
 *
 * @version 2.0.0
 * @architecture Modular JSON-based with CSS variables
 */

import type { MatrixTheme } from '@/lib/animations/matrix/types';

// =============================================================================
// THEME CATEGORIES
// =============================================================================

/**
 * Theme categories for organization
 */
export type ThemeCategory =
  | 'default' // Standard themes
  | 'matrix' // Matrix-style themes
  | 'minimal' // Minimalist themes
  | 'modern' // Modern/sleek themes
  | 'retro' // Retro/vintage themes
  | 'fantasy' // Fantasy/magical themes
  | 'special' // Special/unique themes
  | 'custom'; // User-created themes

// =============================================================================
// COLOR DEFINITIONS
// =============================================================================

/**
 * Complete color palette for a theme
 */
export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;

  // Secondary colors
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;

  // Accent colors
  accent: string;
  accentDark: string;
  accentLight: string;

  // Background colors
  background: string;
  backgroundLight: string;
  backgroundDark: string;
  surface: string;
  surfaceLight: string;
  surfaceDark: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;

  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  borderFocus: string;

  // State colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interactive states
  hover: string;
  active: string;
  disabled: string;

  // Overlay colors
  overlay: string;
  backdrop: string;

  // Gradient colors (for premium effects)
  gradientStart: string;
  gradientEnd: string;
}

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export interface ThemeTypography {
  fontFamily: {
    primary: string;
    secondary?: string;
    monospace: string;
  };

  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };

  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };

  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };

  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

// =============================================================================
// SPACING & LAYOUT
// =============================================================================

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeLayout {
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  spacing: ThemeSpacing;

  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: string;
  };

  transitions: {
    fast: string;
    base: string;
    slow: string;
    all: string;
  };
}

// =============================================================================
// EFFECTS & ANIMATIONS
// =============================================================================

export interface ThemeEffects {
  // Background effects
  backgroundEffect?: 'none' | 'matrix' | 'particles' | 'gradient' | 'animated';
  backgroundOpacity?: number;
  backgroundBlur?: number;

  // Glow effects
  glowEnabled: boolean;
  glowIntensity: number;
  glowColor?: string;

  // Blur effects
  blurEnabled: boolean;
  blurAmount: number;

  // Particle effects
  particlesEnabled: boolean;
  particleColor?: string;
  particleCount?: number;

  // Animation preferences
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;

  // Special effects
  scanlines?: boolean;
  chromatic?: boolean;
  vignette?: boolean;
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

export interface ThemeComponents {
  // Navigation
  navbar: {
    background: string;
    text: string;
    activeBackground: string;
    activeText: string;
    hoverBackground: string;
  };

  // Buttons
  button: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    text: string;
    textHover: string;
  };

  // Cards
  card: {
    background: string;
    border: string;
    shadow: string;
    hover: string;
  };

  // Inputs
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focus: string;
  };

  // Modals
  modal: {
    background: string;
    overlay: string;
    border: string;
  };

  // Notifications
  notification: {
    background: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Chat bubbles
  chatBubble: {
    own: string;
    other: string;
    system: string;
  };

  // Avatar borders (inherit from user customization)
  avatarBorder?: {
    default: string;
    premium: string;
  };
}

// =============================================================================
// MATRIX INTEGRATION
// =============================================================================

export interface MatrixThemeConfig {
  enabled: boolean;
  matrixTheme: MatrixTheme;
  opacity: number;
  layer: 'background' | 'foreground' | 'overlay';
  interactionEnabled?: boolean;
  speed?: number;
  density?: number;
  fontSize?: number;
  columns?: 'auto' | number;
  characters?: 'katakana' | 'latin' | 'binary' | 'custom';
  glowEffect?: boolean;
  trailLength?: number;
  fadeSpeed?: number;
}

// =============================================================================
// MAIN THEME INTERFACE
// =============================================================================

export interface AppTheme {
  // Metadata
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  author?: string;
  version: string;
  isPremium: boolean;
  previewImage?: string;

  // Core styling
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  components: ThemeComponents;

  // Effects
  effects: ThemeEffects;

  // Matrix integration (optional)
  matrix?: MatrixThemeConfig;

  // Custom CSS (advanced users)
  customCSS?: string;

  // Accessibility
  accessibility: {
    highContrast: boolean;
    colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    focusIndicators: boolean;
  };
}

// =============================================================================
// THEME PRESET
// =============================================================================

/**
 * Lightweight theme preset for quick switching
 * Can be expanded to full theme when needed
 */
export interface ThemePreset {
  id: string;
  name: string;
  category: ThemeCategory;
  colors: Pick<ThemeColors, 'primary' | 'secondary' | 'background' | 'textPrimary'>;
  isPremium: boolean;
}

// =============================================================================
// USER THEME PREFERENCES
// =============================================================================

/**
 * User's theme selection and customizations
 * Combines app theme with personal customizations
 */
export interface UserThemePreferences {
  // Selected app theme
  currentThemeId: string;

  // User customizations (from existing theme store)
  userCustomizations: {
    avatarBorder: string;
    avatarBorderColor: string;
    chatBubbleStyle: string;
    chatBubbleColor: string;
    profileCardStyle: string;
    // ... other user-specific customizations
  };

  // Override theme settings
  overrides?: {
    colors?: Partial<ThemeColors>;
    effects?: Partial<ThemeEffects>;
  };

  // Accessibility overrides
  accessibilityOverrides?: {
    reduceMotion?: boolean;
    highContrast?: boolean;
    fontSize?: number; // percentage
  };
}

// =============================================================================
// THEME REGISTRY
// =============================================================================

/**
 * Theme registry for managing all available themes
 */
export interface ThemeRegistry {
  themes: Map<string, AppTheme>;
  presets: Map<string, ThemePreset>;
  categories: Map<ThemeCategory, string[]>; // category -> theme IDs
}

// =============================================================================
// THEME API
// =============================================================================

/**
 * Theme API interface for runtime theme management
 */
export interface ThemeAPI {
  // Get themes
  getTheme(id: string): AppTheme | undefined;
  getAllThemes(): AppTheme[];
  getThemesByCategory(category: ThemeCategory): AppTheme[];

  // Register themes
  registerTheme(theme: AppTheme): void;
  unregisterTheme(id: string): void;

  // Apply themes
  applyTheme(id: string): void;
  getCurrentTheme(): AppTheme | undefined;

  // Theme switching
  switchTheme(fromId: string, toId: string, duration?: number): Promise<void>;

  // Custom themes
  createCustomTheme(base: string, overrides: Partial<AppTheme>): AppTheme;
  exportTheme(id: string): string; // JSON
  importTheme(json: string): AppTheme;

  // Utilities
  getCSSVariables(theme: AppTheme): Record<string, string>;
  validateTheme(theme: Partial<AppTheme>): boolean;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  MatrixTheme, // Re-export for convenience
};
