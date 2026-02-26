/**
 * CGraph Mobile Design System v2.0
 * Revolutionary Next-Gen Design Foundation
 *
 * This module defines the complete design system including:
 * - Color palettes with Matrix/Cyberpunk themes
 * - Typography scales
 * - Spacing system (8px base)
 * - Shadow presets
 * - Border radius tokens
 * - Rarity system for gamification
 * - Animation configurations
 */

// ==================== COLOR PALETTES ====================

export const Colors = {
  // Primary - Matrix Green
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main primary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Dark theme
  dark: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0e14',
  },

  // Accent colors
  purple: {
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
  },
  pink: {
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
  },
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  blue: {
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
  },
  red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Matrix/Cyber theme
  matrix: {
    green: '#00ff41',
    darkGreen: '#003b00',
    phosphor: '#39ff14',
  },
  neon: {
    cyan: '#00f5ff',
    magenta: '#ff00ff',
    yellow: '#ffff00',
    orange: '#ff6600',
    pink: '#ff1493',
  },

  // Holographic colors
  holographic: {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    tertiary: '#ffff00',
    shimmer: 'rgba(255, 255, 255, 0.3)',
  },

  // Semantic colors
  semantic: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Chat bubble presets
  bubbles: {
    mine: ['#10b981', '#059669'],
    theirs: ['#374151', '#1f2937'],
    premium: ['#8b5cf6', '#6d28d9'],
    legendary: ['#f59e0b', '#d97706'],
    rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#9400d3'],
  },

  // Background gradients
  gradients: {
    midnight: ['#0f0c29', '#302b63', '#24243e'],
    aurora: ['#00d2ff', '#3a7bd5'],
    sunset: ['#ff6b6b', '#feca57'],
    cosmic: ['#667eea', '#764ba2'],
    forest: ['#134e5e', '#71b280'],
    fire: ['#f12711', '#f5af19'],
    ocean: ['#2193b0', '#6dd5ed'],
    matrix: ['#003b00', '#00ff41', '#003b00'],
  },
};

// ==================== RARITY SYSTEM ====================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

export const RarityColors: Record<Rarity, { primary: string; secondary: string; glow: string }> = {
  common: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    glow: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.5)',
  },
  epic: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.5)',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.6)',
  },
  mythic: {
    primary: '#ec4899',
    secondary: '#db2777',
    glow: 'rgba(236, 72, 153, 0.6)',
  },
  divine: {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    glow: 'rgba(0, 245, 255, 0.7)',
  },
};

export const RarityNames: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
  divine: 'Divine',
};

// ==================== TYPOGRAPHY ====================

export const Typography = {
  // Font families
  fontFamily: {
    sans: 'System',
    mono: 'SpaceMono',
  },

  // Font sizes (in px)
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
  },

  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

// ==================== SPACING SYSTEM (8px base) ====================

export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// ==================== BORDER RADIUS ====================

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ==================== SHADOWS ====================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  // Glow shadows
  glowPrimary: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  glowNeon: {
    shadowColor: Colors.neon.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  glowError: {
    shadowColor: Colors.red[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  glowSuccess: {
    shadowColor: Colors.semantic.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ==================== Z-INDEX ====================

export const ZIndex = {
  behind: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  max: 9999,
};

// ==================== ANIMATION DURATIONS ====================

export const AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
  // Special durations
  pageTransition: 400,
  modalOpen: 300,
  modalClose: 200,
  tooltipShow: 200,
  tooltipHide: 150,
  buttonPress: 100,
  levelUp: 2000,
  achievement: 3000,
  confetti: 5000,
};

// ==================== BREAKPOINTS ====================

export const Breakpoints = {
  xs: 0,
  sm: 380,
  md: 480,
  lg: 768,
  xl: 1024,
  '2xl': 1280,
};

// ==================== ICON SIZES ====================

export const IconSizes = {
  xs: 12,
  sm: 16,
  base: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
};

// ==================== AVATAR SIZES ====================

export const AvatarSizes = {
  xs: 24,
  sm: 32,
  base: 40,
  md: 48,
  lg: 56,
  xl: 64,
  '2xl': 80,
  '3xl': 96,
  '4xl': 128,
};

// ==================== BUTTON SIZES ====================

export const ButtonSizes = {
  xs: { height: 28, paddingHorizontal: 8, fontSize: 12 },
  sm: { height: 32, paddingHorizontal: 12, fontSize: 13 },
  base: { height: 40, paddingHorizontal: 16, fontSize: 14 },
  md: { height: 44, paddingHorizontal: 20, fontSize: 15 },
  lg: { height: 52, paddingHorizontal: 24, fontSize: 16 },
  xl: { height: 60, paddingHorizontal: 32, fontSize: 18 },
};

// ==================== INPUT SIZES ====================

export const InputSizes = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 14 },
  base: { height: 44, paddingHorizontal: 16, fontSize: 15 },
  md: { height: 52, paddingHorizontal: 16, fontSize: 16 },
  lg: { height: 60, paddingHorizontal: 20, fontSize: 18 },
};

// ==================== THEME PRESETS ====================

export const ThemePresets = {
  default: {
    name: 'Default',
    background: Colors.dark[900],
    surface: Colors.dark[800],
    card: Colors.dark[700],
    primary: Colors.primary[500],
    text: Colors.dark[50],
    textSecondary: Colors.dark[400],
    border: Colors.dark[600],
  },
  matrix: {
    name: 'Matrix',
    background: '#0a0a0a',
    surface: '#0f1a0f',
    card: '#142514',
    primary: Colors.matrix.green,
    text: Colors.matrix.green,
    textSecondary: Colors.matrix.darkGreen,
    border: Colors.matrix.darkGreen,
  },
  cyberpunk: {
    name: 'Cyberpunk',
    background: '#0d0221',
    surface: '#190535',
    card: '#2d0845',
    primary: Colors.neon.magenta,
    text: Colors.neon.cyan,
    textSecondary: Colors.purple[400],
    border: Colors.neon.magenta,
  },
  midnight: {
    name: 'Midnight',
    background: '#0f0c29',
    surface: '#1a1535',
    card: '#252040',
    primary: Colors.blue[500],
    text: Colors.dark[50],
    textSecondary: Colors.dark[400],
    border: Colors.blue[600],
  },
  sunset: {
    name: 'Sunset',
    background: '#1a0a0a',
    surface: '#2d1515',
    card: '#3d1f1f',
    primary: Colors.amber[500],
    text: Colors.dark[50],
    textSecondary: Colors.dark[400],
    border: Colors.amber[600],
  },
};

// ==================== CHAT BUBBLE STYLES ====================

export const ChatBubbleStyles = {
  rounded: { borderRadius: 20 },
  sharp: { borderRadius: 4 },
  bubble: { borderRadius: 24 },
  modern: { borderRadius: 16 },
  superRounded: { borderRadius: 28 },
  ios: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  android: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
};

// ==================== TYPING INDICATOR STYLES ====================

export type TypingIndicatorStyle = 'dots' | 'wave' | 'pulse' | 'bars' | 'bounce' | 'fade';

export const TypingIndicatorConfig: Record<TypingIndicatorStyle, { duration: number; delay: number }> = {
  dots: { duration: durations.dramatic.ms, delay: 100 },
  wave: { duration: durations.extended.ms, delay: 150 },
  pulse: { duration: durations.verySlow.ms, delay: 0 },
  bars: { duration: durations.smooth.ms, delay: 80 },
  bounce: { duration: durations.slower.ms, delay: 120 },
  fade: { duration: 700, delay: 200 },
};

// ==================== EXPORTS ====================

export default {
  Colors,
  RarityColors,
  RarityNames,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ZIndex,
  AnimationDurations,
  Breakpoints,
  IconSizes,
  AvatarSizes,
  ButtonSizes,
  InputSizes,
  ThemePresets,
  ChatBubbleStyles,
  TypingIndicatorConfig,
};
