/**
 * AI-Powered Theme Engine
 *
 * Intelligent theme generation and adaptation system.
 * Features dynamic color generation, adaptive layouts, and preference learning.
 *
 * @version 1.0.0
 * @since v0.7.33
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  glow: string;
  gradient: [string, string];
}

export interface ThemeMetadata {
  name: string;
  mood: 'energetic' | 'calm' | 'professional' | 'playful' | 'dark' | 'light';
  accessibility: 'high' | 'medium' | 'low';
  contrastRatio: number;
  generatedAt: Date;
}

export interface AdaptiveTheme {
  colors: ThemeColors;
  metadata: ThemeMetadata;
  animations: {
    speed: number;
    easing: string;
  };
  spacing: {
    unit: number;
    scale: number[];
  };
}

export interface UserPreference {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  activity: 'browsing' | 'chatting' | 'working' | 'gaming';
  previousThemes: string[];
  interactionPatterns: {
    clickRate: number;
    scrollSpeed: number;
    dwell: number;
  };
}

// =============================================================================
// COLOR THEORY UTILITIES
// =============================================================================

class ColorTheory {
  /**
   * Convert HEX to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to HEX
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Convert RGB to HSL
   */
  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to RGB
   */
  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Calculate color contrast ratio
   */
  static getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
    };

    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Generate complementary color
   */
  static getComplementary(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + 180) % 360;
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Generate analogous colors
   */
  static getAnalogous(hex: string, offset: number = 30): [string, string] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    const hsl1 = { ...hsl, h: (hsl.h + offset) % 360 };
    const hsl2 = { ...hsl, h: (hsl.h - offset + 360) % 360 };

    const rgb1 = this.hslToRgb(hsl1.h, hsl1.s, hsl1.l);
    const rgb2 = this.hslToRgb(hsl2.h, hsl2.s, hsl2.l);

    return [this.rgbToHex(rgb1.r, rgb1.g, rgb1.b), this.rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
  }

  /**
   * Generate triadic colors
   */
  static getTriadic(hex: string): [string, string, string] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 };
    const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 };

    const rgb1 = this.hslToRgb(hsl1.h, hsl1.s, hsl1.l);
    const rgb2 = this.hslToRgb(hsl2.h, hsl2.s, hsl2.l);

    return [hex, this.rgbToHex(rgb1.r, rgb1.g, rgb1.b), this.rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
  }
}

// =============================================================================
// AI THEME GENERATOR
// =============================================================================

export class AIThemeEngine {
  private preferences: UserPreference | null = null;

  /**
   * Set user preferences for personalized theme generation
   */
  setPreferences(preferences: UserPreference): void {
    this.preferences = preferences;
  }

  /**
   * Generate theme based on time of day
   */
  private getTimeBasedPalette(): { base: string; mood: ThemeMetadata['mood'] } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      // Morning - energetic, warm
      return { base: '#10b981', mood: 'energetic' };
    } else if (hour >= 12 && hour < 17) {
      // Afternoon - professional, balanced
      return { base: '#3b82f6', mood: 'professional' };
    } else if (hour >= 17 && hour < 21) {
      // Evening - calm, warm
      return { base: '#f59e0b', mood: 'calm' };
    } else {
      // Night - dark, soothing
      return { base: '#8b5cf6', mood: 'dark' };
    }
  }

  /**
   * Generate theme based on activity
   */
  private getActivityModifiers(activity: UserPreference['activity']): {
    saturation: number;
    lightness: number;
    speed: number;
  } {
    switch (activity) {
      case 'gaming':
        return { saturation: 100, lightness: 50, speed: 1.5 };
      case 'working':
        return { saturation: 40, lightness: 45, speed: 0.8 };
      case 'chatting':
        return { saturation: 70, lightness: 48, speed: 1.0 };
      case 'browsing':
      default:
        return { saturation: 60, lightness: 50, speed: 1.0 };
    }
  }

  /**
   * Generate complete adaptive theme
   */
  generateTheme(baseName?: string): AdaptiveTheme {
    // Get time-based palette
    const timeBasedPalette = this.getTimeBasedPalette();
    const baseColor = baseName ? this.getNamedColor(baseName) : timeBasedPalette.base;

    // Get activity modifiers
    const activity = this.preferences?.activity || 'browsing';
    const modifiers = this.getActivityModifiers(activity);

    // Generate color scheme
    const rgb = ColorTheory.hexToRgb(baseColor);
    const hsl = ColorTheory.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Apply modifiers
    hsl.s = modifiers.saturation;
    hsl.l = modifiers.lightness;

    const primary = ColorTheory.rgbToHex(
      ...(Object.values(ColorTheory.hslToRgb(hsl.h, hsl.s, hsl.l)) as [number, number, number])
    );

    // Generate complementary and analogous colors
    const [analogous1, analogous2] = ColorTheory.getAnalogous(primary);
    const complementary = ColorTheory.getComplementary(primary);

    // Build theme colors
    const colors: ThemeColors = {
      primary,
      secondary: analogous1,
      accent: complementary,
      background: '#111827',
      surface: '#1f2937',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      border: 'rgba(255, 255, 255, 0.1)',
      glow: `${primary}80`,
      gradient: [primary, analogous2],
    };

    // Calculate contrast ratio
    const contrastRatio = ColorTheory.getContrastRatio(colors.text, colors.background);

    // Build metadata
    const metadata: ThemeMetadata = {
      name: baseName || `AI-${timeBasedPalette.mood}-${Date.now()}`,
      mood: timeBasedPalette.mood,
      accessibility: contrastRatio >= 7 ? 'high' : contrastRatio >= 4.5 ? 'medium' : 'low',
      contrastRatio,
      generatedAt: new Date(),
    };

    return {
      colors,
      metadata,
      animations: {
        speed: modifiers.speed,
        easing: modifiers.speed > 1 ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'ease-out',
      },
      spacing: {
        unit: 8,
        scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
      },
    };
  }

  /**
   * Get predefined named color
   */
  private getNamedColor(name: string): string {
    const namedColors: Record<string, string> = {
      matrix: '#00ff41',
      cyber: '#00d4ff',
      neon: '#ff0080',
      amber: '#fbbf24',
      emerald: '#10b981',
      violet: '#8b5cf6',
      rose: '#f43f5e',
    };

    return namedColors[name] || namedColors.matrix || '#00ff41';
  }

  /**
   * Generate theme variations
   */
  generateVariations(baseTheme: AdaptiveTheme, count: number = 5): AdaptiveTheme[] {
    const variations: AdaptiveTheme[] = [];
    const baseRgb = ColorTheory.hexToRgb(baseTheme.colors.primary);
    const baseHsl = ColorTheory.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

    for (let i = 0; i < count; i++) {
      const hueShift = (i * 360) / count;
      const newHsl = {
        h: (baseHsl.h + hueShift) % 360,
        s: baseHsl.s,
        l: baseHsl.l,
      };

      const newRgb = ColorTheory.hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newPrimary = ColorTheory.rgbToHex(newRgb.r, newRgb.g, newRgb.b);

      // Generate theme with new primary color
      const baseName = `variation-${i}`;
      const variation = this.generateTheme(baseName);
      variation.colors.primary = newPrimary;

      variations.push(variation);
    }

    return variations;
  }

  /**
   * Learn from user interactions (simplified ML approach)
   */
  learnFromInteraction(themeUsed: string, satisfaction: number): void {
    // Store in localStorage for persistence
    let history: Array<{ theme: string; satisfaction: number; timestamp: number }> = [];
    try {
      history = JSON.parse(localStorage.getItem('theme-history') || '[]');
    } catch {
      // Corrupted data, reset
      history = [];
    }
    history.push({
      theme: themeUsed,
      satisfaction,
      timestamp: Date.now(),
    });

    // Keep last 50 interactions
    if (history.length > 50) {
      history.shift();
    }

    localStorage.setItem('theme-history', JSON.stringify(history));
  }

  /**
   * Get recommended theme based on learned preferences
   */
  getRecommendedTheme(): AdaptiveTheme {
    let history: Array<{ theme: string; satisfaction: number; timestamp: number }> = [];
    try {
      history = JSON.parse(localStorage.getItem('theme-history') || '[]');
    } catch {
      // Corrupted data, use default
      return this.generateTheme();
    }

    // If no history, return default
    if (history.length === 0) {
      return this.generateTheme();
    }

    // Find most satisfactory theme
    const bestTheme = history.reduce((best: any, current: any) =>
      current.satisfaction > best.satisfaction ? current : best
    );

    return this.generateTheme(bestTheme.theme);
  }

  /**
   * Apply theme to DOM
   */
  applyTheme(theme: AdaptiveTheme): void {
    const root = document.documentElement;

    // Apply color variables
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-glow', theme.colors.glow);

    // Apply animation variables
    root.style.setProperty('--animation-speed', theme.animations.speed.toString());
    root.style.setProperty('--animation-easing', theme.animations.easing);

    // Apply spacing variables
    root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const themeEngine = new AIThemeEngine();

export default themeEngine;
