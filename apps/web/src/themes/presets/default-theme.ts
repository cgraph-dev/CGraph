/**
 * Default CGraph Theme
 *
 * The standard theme - clean, modern, and accessible
 * Serves as the base for all other themes
 */

import type { AppTheme } from '../theme-types';

export const defaultTheme: AppTheme = {
  id: 'default',
  name: 'CGraph Default',
  description: 'Clean, modern design with excellent readability',
  category: 'default',
  version: '1.0.0',
  isPremium: false,

  colors: {
    // Primary - Emerald Green
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    primaryGlow: 'rgba(16, 185, 129, 0.5)',

    // Secondary - Teal
    secondary: '#14b8a6',
    secondaryDark: '#0f766e',
    secondaryLight: '#5eead4',

    // Accent - Purple
    accent: '#8b5cf6',
    accentDark: '#7c3aed',
    accentLight: '#a78bfa',

    // Backgrounds
    background: '#0f172a', // Slate 900
    backgroundLight: '#1e293b', // Slate 800
    backgroundDark: '#020617', // Slate 950
    surface: '#1e293b',
    surfaceLight: '#334155', // Slate 700
    surfaceDark: '#0f172a',

    // Text
    textPrimary: '#f1f5f9', // Slate 100
    textSecondary: '#cbd5e1', // Slate 300
    textDisabled: '#64748b', // Slate 500
    textInverse: '#0f172a',

    // Borders
    border: '#334155', // Slate 700
    borderLight: '#475569', // Slate 600
    borderDark: '#1e293b', // Slate 800
    borderFocus: '#10b981', // Primary

    // States
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
    info: '#3b82f6', // Blue 500

    // Interactive
    hover: 'rgba(16, 185, 129, 0.1)',
    active: 'rgba(16, 185, 129, 0.2)',
    disabled: 'rgba(100, 116, 139, 0.5)',

    // Overlays
    overlay: 'rgba(15, 23, 42, 0.8)',
    backdrop: 'rgba(0, 0, 0, 0.5)',

    // Gradients
    gradientStart: '#10b981',
    gradientEnd: '#34d399',
  },

  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Plus Jakarta Sans, Inter, sans-serif',
      monospace: '"Fira Code", "JetBrains Mono", "Cascadia Code", Consolas, monospace',
    },

    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
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
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },

  layout: {
    borderRadius: {
      none: '0',
      sm: '0.25rem', // 4px
      md: '0.5rem', // 8px
      lg: '0.75rem', // 12px
      xl: '1rem', // 16px
      full: '9999px',
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
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      glow: '0 0 20px rgba(16, 185, 129, 0.5)',
    },

    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  components: {
    navbar: {
      background: '#1e293b',
      text: '#cbd5e1',
      activeBackground: 'rgba(16, 185, 129, 0.1)',
      activeText: '#10b981',
      hoverBackground: 'rgba(16, 185, 129, 0.05)',
    },

    button: {
      primary: 'linear-gradient(135deg, #10b981, #34d399)',
      primaryHover: 'linear-gradient(135deg, #059669, #10b981)',
      secondary: '#334155',
      secondaryHover: '#475569',
      text: '#10b981',
      textHover: '#34d399',
    },

    card: {
      background: '#1e293b',
      border: '#334155',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      hover: '#334155',
    },

    input: {
      background: '#0f172a',
      border: '#334155',
      text: '#f1f5f9',
      placeholder: '#64748b',
      focus: '#10b981',
    },

    modal: {
      background: '#1e293b',
      overlay: 'rgba(15, 23, 42, 0.8)',
      border: '#334155',
    },

    notification: {
      background: '#1e293b',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },

    chatBubble: {
      own: '#10b981',
      other: '#334155',
      system: '#475569',
    },
  },

  effects: {
    backgroundEffect: 'none',
    backgroundOpacity: 1,
    backgroundBlur: 0,

    glowEnabled: true,
    glowIntensity: 0.5,

    blurEnabled: false,
    blurAmount: 10,

    particlesEnabled: false,

    animationSpeed: 'normal',
    reduceMotion: false,

    scanlines: false,
    chromatic: false,
    vignette: false,
  },

  accessibility: {
    highContrast: false,
    colorBlindMode: 'none',
    focusIndicators: true,
  },
};
