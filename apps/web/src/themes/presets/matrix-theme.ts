/**
 * Matrix CGraph Theme
 *
 * The iconic Matrix digital rain aesthetic
 * Features cascading green characters, dark backgrounds, and terminal-inspired UI
 * Integrates with the existing Matrix animation system
 */

import type { AppTheme } from '../theme-types';
import { MATRIX_GREEN } from '@/lib/animations/matrix/themes';

export const matrixTheme: AppTheme = {
  id: 'matrix',
  name: 'Matrix Digital Rain',
  description: 'Enter the Matrix with cascading green code and terminal aesthetics',
  category: 'special',
  version: '1.0.0',
  isPremium: true,

  colors: {
    // Primary - Matrix Green
    primary: '#39ff14', // Bright neon green
    primaryDark: '#00cc33', // Medium green
    primaryLight: '#66ff44', // Light green
    primaryGlow: 'rgba(57, 255, 20, 0.6)',

    // Secondary - Darker Green
    secondary: '#00ff41', // Electric green
    secondaryDark: '#00aa22', // Dark green
    secondaryLight: '#33ff66', // Light electric green

    // Accent - Cyan (for important elements)
    accent: '#00d4ff',
    accentDark: '#0099cc',
    accentLight: '#33ddff',

    // Backgrounds - Deep black with subtle green tint
    background: '#000000', // Pure black
    backgroundLight: '#0a0f0a', // Very dark green-black
    backgroundDark: '#000000', // Pure black
    surface: '#0f1f0f', // Dark green surface
    surfaceLight: '#1a2f1a', // Lighter green surface
    surfaceDark: '#050a05', // Darker green surface

    // Text - Green terminal text
    textPrimary: '#39ff14', // Bright green text
    textSecondary: '#00cc33', // Medium green text
    textDisabled: '#006611', // Dark green disabled
    textInverse: '#000000', // Black on green

    // Borders - Glowing green
    border: '#00aa22', // Dark green border
    borderLight: '#00cc33', // Medium green border
    borderDark: '#005511', // Very dark green border
    borderFocus: '#39ff14', // Bright green focus

    // States - Matrix themed
    success: '#00ff41', // Electric green
    warning: '#ffff00', // Yellow (alert)
    error: '#ff0000', // Red (system error)
    info: '#00d4ff', // Cyan (info)

    // Interactive - Glowing green effects
    hover: 'rgba(57, 255, 20, 0.15)',
    active: 'rgba(57, 255, 20, 0.3)',
    disabled: 'rgba(0, 102, 17, 0.5)',

    // Overlays - Dark with green tint
    overlay: 'rgba(0, 0, 0, 0.9)',
    backdrop: 'rgba(0, 15, 0, 0.8)',

    // Gradients - Green spectrum
    gradientStart: '#39ff14',
    gradientEnd: '#00aa22',
  },

  typography: {
    fontFamily: {
      primary: '"Courier New", "Fira Code", "JetBrains Mono", monospace',
      secondary: '"Courier New", monospace',
      monospace: '"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, monospace',
    },

    fontSize: {
      xs: '0.7rem', // 11.2px - smaller for terminal feel
      sm: '0.8rem', // 12.8px
      base: '0.95rem', // 15.2px
      lg: '1.1rem', // 17.6px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.2, // Tighter for terminal
      normal: 1.4,
      relaxed: 1.6,
    },

    letterSpacing: {
      tight: '-0.02em',
      normal: '0.02em', // Slightly wider for readability
      wide: '0.05em',
    },
  },

  layout: {
    borderRadius: {
      none: '0',
      sm: '0.125rem', // 2px - sharp corners
      md: '0.25rem', // 4px
      lg: '0.375rem', // 6px
      xl: '0.5rem', // 8px
      full: '0', // No rounded elements in Matrix
    },

    spacing: {
      xs: '0.25rem', // 4px
      sm: '0.5rem', // 8px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem', // 32px
      '2xl': '3rem', // 48px
      '3xl': '4rem', // 64px
      '4xl': '6rem', // 96px
    },

    shadows: {
      none: 'none',
      sm: '0 1px 2px 0 rgba(57, 255, 20, 0.1)',
      md: '0 4px 6px -1px rgba(57, 255, 20, 0.2)',
      lg: '0 10px 15px -3px rgba(57, 255, 20, 0.3)',
      xl: '0 20px 25px -5px rgba(57, 255, 20, 0.4)',
      glow: '0 0 30px rgba(57, 255, 20, 0.8), 0 0 60px rgba(57, 255, 20, 0.4)',
    },

    transitions: {
      fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
      all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  components: {
    navbar: {
      background: '#000000',
      text: '#39ff14',
      activeBackground: 'rgba(57, 255, 20, 0.2)',
      activeText: '#66ff44',
      hoverBackground: 'rgba(57, 255, 20, 0.1)',
    },

    button: {
      primary: 'linear-gradient(135deg, #39ff14, #00cc33)',
      primaryHover: 'linear-gradient(135deg, #66ff44, #00ff41)',
      secondary: '#0f1f0f',
      secondaryHover: '#1a2f1a',
      text: '#39ff14',
      textHover: '#66ff44',
    },

    card: {
      background: 'rgba(15, 31, 15, 0.8)',
      border: '#00aa22',
      shadow: '0 0 20px rgba(57, 255, 20, 0.3)',
      hover: 'rgba(26, 47, 26, 0.8)',
    },

    input: {
      background: '#000000',
      border: '#00aa22',
      text: '#39ff14',
      placeholder: '#006611',
      focus: '#39ff14',
    },

    modal: {
      background: 'rgba(0, 0, 0, 0.95)',
      overlay: 'rgba(0, 15, 0, 0.9)',
      border: '#00cc33',
    },

    notification: {
      background: '#0f1f0f',
      border: '#00aa22',
      success: '#00ff41',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00d4ff',
    },

    chatBubble: {
      own: '#00cc33',
      other: '#1a2f1a',
      system: '#0f1f0f',
    },
  },

  effects: {
    backgroundEffect: 'matrix',
    backgroundOpacity: 0.3,
    backgroundBlur: 0,

    glowEnabled: true,
    glowIntensity: 0.8,

    blurEnabled: false,
    blurAmount: 0,

    particlesEnabled: false,

    animationSpeed: 'normal',
    reduceMotion: false,

    scanlines: true, // CRT scanline effect
    chromatic: false,
    vignette: true, // Dark edges
  },

  // Matrix-specific configuration
  matrix: {
    enabled: true,
    matrixTheme: MATRIX_GREEN,
    layer: 'background',
    opacity: 0.3,
    speed: 1.0,
    density: 0.8,
    fontSize: 14,
    columns: 'auto',
    characters: 'katakana', // katakana, latin, binary, custom
    glowEffect: true,
    trailLength: 15,
    fadeSpeed: 0.05,
  },

  accessibility: {
    highContrast: true,
    colorBlindMode: 'none',
    focusIndicators: true,
  },
};
