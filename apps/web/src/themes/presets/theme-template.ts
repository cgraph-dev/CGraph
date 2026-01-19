/**
 * Theme Template
 *
 * Copy this file to create a new theme.
 * Follow the structure and replace values as needed.
 *
 * Steps to create a new theme:
 * 1. Copy this file and rename it (e.g., cyberpunk-theme.ts)
 * 2. Update the theme ID, name, and description
 * 3. Customize colors, typography, and layout
 * 4. Configure effects and components
 * 5. Import and register in ThemeRegistry.ts
 */

import type { AppTheme } from '../theme-types';

export const templateTheme: AppTheme = {
  // ============================================================================
  // THEME METADATA
  // ============================================================================
  id: 'my-theme', // Unique identifier (kebab-case)
  name: 'My Custom Theme', // Display name
  description: 'A custom theme', // Short description
  category: 'custom', // Category: default, dark, light, special, custom, gaming, professional
  version: '1.0.0', // Semantic versioning
  isPremium: false, // Set to true if premium-only

  // ============================================================================
  // COLORS - Define all color tokens
  // ============================================================================
  colors: {
    // Primary color (main brand color)
    primary: '#10b981', // Main color
    primaryDark: '#059669', // Darker shade
    primaryLight: '#34d399', // Lighter shade
    primaryGlow: 'rgba(16, 185, 129, 0.5)', // Glow effect

    // Secondary color (complementary)
    secondary: '#14b8a6',
    secondaryDark: '#0f766e',
    secondaryLight: '#5eead4',

    // Accent color (highlights)
    accent: '#8b5cf6',
    accentDark: '#7c3aed',
    accentLight: '#a78bfa',

    // Backgrounds
    background: '#0f172a', // Main background
    backgroundLight: '#1e293b', // Lighter background
    backgroundDark: '#020617', // Darker background
    surface: '#1e293b', // Surface elements
    surfaceLight: '#334155', // Lighter surface
    surfaceDark: '#0f172a', // Darker surface

    // Text colors
    textPrimary: '#f1f5f9', // Main text
    textSecondary: '#cbd5e1', // Secondary text
    textDisabled: '#64748b', // Disabled text
    textInverse: '#0f172a', // Text on colored backgrounds

    // Borders
    border: '#334155', // Default border
    borderLight: '#475569', // Lighter border
    borderDark: '#1e293b', // Darker border
    borderFocus: '#10b981', // Focus state

    // State colors
    success: '#10b981', // Success states
    warning: '#f59e0b', // Warning states
    error: '#ef4444', // Error states
    info: '#3b82f6', // Info states

    // Interactive states
    hover: 'rgba(16, 185, 129, 0.1)', // Hover overlay
    active: 'rgba(16, 185, 129, 0.2)', // Active/pressed state
    disabled: 'rgba(100, 116, 139, 0.5)', // Disabled overlay

    // Overlays
    overlay: 'rgba(15, 23, 42, 0.8)', // Modal overlay
    backdrop: 'rgba(0, 0, 0, 0.5)', // Backdrop

    // Gradients
    gradientStart: '#10b981',
    gradientEnd: '#34d399',
  },

  // ============================================================================
  // TYPOGRAPHY - Font settings
  // ============================================================================
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: 'Plus Jakarta Sans, Inter, sans-serif',
      monospace: '"Fira Code", "JetBrains Mono", Consolas, monospace',
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

  // ============================================================================
  // LAYOUT - Spacing, borders, shadows
  // ============================================================================
  layout: {
    borderRadius: {
      none: '0',
      sm: '0.25rem', // 4px
      md: '0.5rem', // 8px
      lg: '0.75rem', // 12px
      xl: '1rem', // 16px
      full: '9999px', // Fully rounded
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

  // ============================================================================
  // COMPONENTS - Component-specific styling
  // ============================================================================
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

  // ============================================================================
  // EFFECTS - Visual effects and animations
  // ============================================================================
  effects: {
    backgroundEffect: 'none', // 'none', 'gradient', 'particles', 'matrix'
    backgroundOpacity: 1,
    backgroundBlur: 0,

    glowEnabled: true, // Enable glow effects
    glowIntensity: 0.5, // 0-1

    blurEnabled: false, // Glassmorphism blur
    blurAmount: 10, // px

    particlesEnabled: false, // Particle effects

    animationSpeed: 'normal', // 'slow', 'normal', 'fast'
    reduceMotion: false, // Respect prefers-reduced-motion

    scanlines: false, // CRT scanline effect
    chromatic: false, // Chromatic aberration
    vignette: false, // Vignette effect
  },

  // ============================================================================
  // MATRIX CONFIGURATION (Optional)
  // Only include if theme uses Matrix effect
  // ============================================================================
  matrix: undefined,
  // Example Matrix config:
  // matrix: {
  //   enabled: true,
  //   matrixTheme: MATRIX_GREEN,    // Import from @/lib/animations/matrix/themes
  //   layer: 'background',           // 'background', 'foreground', 'overlay'
  //   opacity: 0.3,
  //   speed: 1.0,
  //   density: 0.8,
  //   fontSize: 14,
  //   columns: 'auto',
  //   characters: 'katakana',        // 'katakana', 'latin', 'binary', 'custom'
  //   glowEffect: true,
  //   trailLength: 15,
  //   fadeSpeed: 0.05,
  // },

  // ============================================================================
  // ACCESSIBILITY - Accessibility settings
  // ============================================================================
  accessibility: {
    highContrast: false, // High contrast mode
    colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    focusIndicators: true, // Always show focus indicators
  },
};

/**
 * THEME CREATION CHECKLIST
 *
 * ✓ Unique theme ID (kebab-case)
 * ✓ Descriptive name and description
 * ✓ Complete color palette (30+ colors)
 * ✓ Typography settings
 * ✓ Layout tokens
 * ✓ Component styles
 * ✓ Effect configuration
 * ✓ Accessibility compliance
 * ✓ Test in light and dark modes
 * ✓ Validate contrast ratios (WCAG 2.1 AA)
 * ✓ Test with reduce motion
 * ✓ Register in ThemeRegistry.ts
 */

/**
 * ACCESSIBILITY REQUIREMENTS
 *
 * Text Contrast:
 * - Normal text: 4.5:1 minimum (WCAG AA)
 * - Large text: 3:1 minimum (WCAG AA)
 * - UI components: 3:1 minimum
 *
 * Focus Indicators:
 * - Must be visible on all interactive elements
 * - Minimum 3px outline
 * - High contrast with background
 *
 * Color Blind Safe:
 * - Don't rely on color alone
 * - Use icons and labels
 * - Test with color blind simulators
 */
