/**
 * Matrix Animation Themes Tests
 * Tests theme definitions and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  MATRIX_GREEN,
  CYBER_BLUE,
  BLOOD_RED,
  GOLDEN,
  PURPLE_HAZE,
  NEON_PINK,
  ICE,
  FIRE,
  THEME_REGISTRY,
  THEME_METADATA,
  getTheme,
  createCustomTheme,
  interpolateThemes,
  parseColor,
  toRGBA,
} from '../themes';
import type { MatrixTheme } from '../types';

describe('Matrix Themes', () => {
  // Helper to validate theme structure
  const validateThemeStructure = (theme: MatrixTheme) => {
    // Required string properties
    expect(typeof theme.id).toBe('string');
    expect(typeof theme.name).toBe('string');
    expect(typeof theme.preset).toBe('string');
    expect(typeof theme.primaryColor).toBe('string');
    expect(typeof theme.secondaryColor).toBe('string');
    expect(typeof theme.tertiaryColor).toBe('string');
    expect(typeof theme.backgroundColor).toBe('string');

    // Trail gradient should be array
    expect(Array.isArray(theme.trailGradient)).toBe(true);
    expect(theme.trailGradient!.length).toBeGreaterThan(0);

    // Glow configuration
    expect(theme.glow).toBeDefined();
    expect(typeof theme.glow.enabled).toBe('boolean');
    expect(typeof theme.glow.radius).toBe('number');
    expect(typeof theme.glow.color).toBe('string');
    expect(typeof theme.glow.intensity).toBe('number');

    // Depth colors
    expect(theme.depthColors).toBeDefined();
    expect(typeof theme.depthColors!.near).toBe('string');
    expect(typeof theme.depthColors!.mid).toBe('string');
    expect(typeof theme.depthColors!.far).toBe('string');

    // Opacity
    expect(theme.opacity).toBeDefined();
    expect(typeof theme.opacity.head).toBe('number');
    expect(typeof theme.opacity.body).toBe('number');
    expect(typeof theme.opacity.tail).toBe('number');
    expect(typeof theme.opacity.background).toBe('number');
  };

  const validateHexColor = (color: string) => {
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  };

  describe('MATRIX_GREEN Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(MATRIX_GREEN);
    });

    it('should have correct id and name', () => {
      expect(MATRIX_GREEN.id).toBe('matrix-green');
      expect(MATRIX_GREEN.name).toBe('Matrix Green');
    });

    it('should have valid hex colors', () => {
      validateHexColor(MATRIX_GREEN.primaryColor);
      validateHexColor(MATRIX_GREEN.secondaryColor);
      validateHexColor(MATRIX_GREEN.tertiaryColor);
      validateHexColor(MATRIX_GREEN.backgroundColor);
    });

    it('should have valid trail gradient', () => {
      expect(MATRIX_GREEN.trailGradient!.length).toBeGreaterThanOrEqual(3);
      for (const stop of MATRIX_GREEN.trailGradient!) {
        expect(stop.position).toBeGreaterThanOrEqual(0);
        expect(stop.position).toBeLessThanOrEqual(1);
        expect(stop.alpha).toBeGreaterThanOrEqual(0);
        expect(stop.alpha).toBeLessThanOrEqual(1);
      }
    });

    it('should have valid glow intensity', () => {
      expect(MATRIX_GREEN.glow.intensity).toBeGreaterThanOrEqual(0);
      expect(MATRIX_GREEN.glow.intensity).toBeLessThanOrEqual(1);
    });
  });

  describe('CYBER_BLUE Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(CYBER_BLUE);
    });

    it('should have correct id and name', () => {
      expect(CYBER_BLUE.id).toBe('cyber-blue');
      expect(CYBER_BLUE.name).toBe('Cyber Blue');
    });

    it('should have valid hex colors', () => {
      validateHexColor(CYBER_BLUE.primaryColor);
      validateHexColor(CYBER_BLUE.secondaryColor);
    });

    it('should have pulsate option in glow', () => {
      expect(typeof CYBER_BLUE.glow.pulsate).toBe('boolean');
    });
  });

  describe('BLOOD_RED Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(BLOOD_RED);
    });

    it('should have correct id and name', () => {
      expect(BLOOD_RED.id).toBe('blood-red');
      expect(BLOOD_RED.name).toBe('Blood Red');
    });

    it('should have valid hex colors', () => {
      validateHexColor(BLOOD_RED.primaryColor);
    });
  });

  describe('GOLDEN Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(GOLDEN);
    });

    it('should have correct id', () => {
      expect(GOLDEN.id).toBe('golden');
    });
  });

  describe('PURPLE_HAZE Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(PURPLE_HAZE);
    });

    it('should have correct id', () => {
      expect(PURPLE_HAZE.id).toBe('purple-haze');
    });
  });

  describe('NEON_PINK Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(NEON_PINK);
    });

    it('should have correct id', () => {
      expect(NEON_PINK.id).toBe('neon-pink');
    });
  });

  describe('ICE Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(ICE);
    });

    it('should have correct id', () => {
      expect(ICE.id).toBe('ice');
    });
  });

  describe('FIRE Theme', () => {
    it('should have valid theme structure', () => {
      validateThemeStructure(FIRE);
    });

    it('should have correct id', () => {
      expect(FIRE.id).toBe('fire');
    });
  });

  describe('THEME_REGISTRY', () => {
    it('should contain all themes', () => {
      expect(THEME_REGISTRY['matrix-green']).toBe(MATRIX_GREEN);
      expect(THEME_REGISTRY['cyber-blue']).toBe(CYBER_BLUE);
      expect(THEME_REGISTRY['blood-red']).toBe(BLOOD_RED);
      expect(THEME_REGISTRY['golden']).toBe(GOLDEN);
      expect(THEME_REGISTRY['purple-haze']).toBe(PURPLE_HAZE);
      expect(THEME_REGISTRY['neon-pink']).toBe(NEON_PINK);
      expect(THEME_REGISTRY['ice']).toBe(ICE);
      expect(THEME_REGISTRY['fire']).toBe(FIRE);
    });

    it('should have at least 8 themes', () => {
      expect(Object.keys(THEME_REGISTRY).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('THEME_METADATA', () => {
    it('should be an array', () => {
      expect(Array.isArray(THEME_METADATA)).toBe(true);
    });

    it('should have metadata for themes', () => {
      expect(THEME_METADATA.length).toBeGreaterThan(0);
      for (const meta of THEME_METADATA) {
        expect(meta.id).toBeDefined();
        expect(meta.name).toBeDefined();
      }
    });
  });

  describe('getTheme', () => {
    it('should return theme by id', () => {
      const theme = getTheme('matrix-green');
      expect(theme).toBe(MATRIX_GREEN);
    });

    it('should return cyber-blue theme', () => {
      const theme = getTheme('cyber-blue');
      expect(theme).toBe(CYBER_BLUE);
    });

    it('should return blood-red theme', () => {
      const theme = getTheme('blood-red');
      expect(theme).toBe(BLOOD_RED);
    });

    it('should return default theme for invalid id', () => {
      const theme = getTheme('invalid-theme-id' as any);
      expect(theme).toBeDefined();
    });

    it('should return all themes from registry', () => {
      const validThemes = ['matrix-green', 'cyber-blue', 'blood-red', 'golden', 'purple-haze', 'neon-pink', 'ice', 'fire'];
      for (const id of validThemes) {
        const theme = getTheme(id as any);
        expect(theme).toBeDefined();
        expect(theme.id).toBe(id);
      }
    });
  });

  describe('createCustomTheme', () => {
    it('should create theme based on existing preset', () => {
      const theme = createCustomTheme('matrix-green', {
        primaryColor: '#ff0000',
      });
      expect(theme.primaryColor).toBe('#ff0000');
      expect(theme.preset).toBe('custom');
    });

    it('should use base theme values for unspecified properties', () => {
      const theme = createCustomTheme('cyber-blue', {});
      expect(theme.glow).toBeDefined();
      expect(theme.opacity).toBeDefined();
      expect(theme.depthColors).toBeDefined();
    });

    it('should allow custom glow settings', () => {
      const theme = createCustomTheme('matrix-green', {
        glow: {
          enabled: true,
          radius: 10,
          color: '#ffffff',
          intensity: 1,
          pulsate: true,
        },
      });
      expect(theme.glow.radius).toBe(10);
      expect(theme.glow.intensity).toBe(1);
    });

    it('should return valid theme structure', () => {
      const theme = createCustomTheme('blood-red', {});
      validateThemeStructure(theme);
    });
  });

  describe('interpolateThemes', () => {
    it('should return first theme colors at t=0', () => {
      const result = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, 0);
      expect(result.primaryColor).toBe(MATRIX_GREEN.primaryColor);
    });

    it('should return second theme colors at t=1', () => {
      const result = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, 1);
      expect(result.primaryColor).toBe(CYBER_BLUE.primaryColor);
    });

    it('should interpolate at t=0.5', () => {
      const result = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, 0.5);
      expect(result).toBeDefined();
      expect(typeof result.primaryColor).toBe('string');
    });

    it('should create valid theme at any t value', () => {
      const tValues = [0, 0.25, 0.5, 0.75, 1];
      for (const t of tValues) {
        const result = interpolateThemes(MATRIX_GREEN, BLOOD_RED, t);
        expect(result.primaryColor).toBeDefined();
        expect(result.secondaryColor).toBeDefined();
      }
    });

    it('should clamp t value below 0', () => {
      const result = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, -0.5);
      expect(result.primaryColor).toBe(MATRIX_GREEN.primaryColor);
    });

    it('should clamp t value above 1', () => {
      const result = interpolateThemes(MATRIX_GREEN, CYBER_BLUE, 1.5);
      expect(result.primaryColor).toBe(CYBER_BLUE.primaryColor);
    });
  });

  describe('parseColor', () => {
    it('should parse 6-digit hex color', () => {
      const result = parseColor('#ff0000');
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should parse hex without hash', () => {
      const result = parseColor('00ff00');
      expect(result.r).toBe(0);
      expect(result.g).toBe(255);
      expect(result.b).toBe(0);
    });

    it('should parse mixed case hex', () => {
      const result = parseColor('#AbCdEf');
      expect(result.r).toBe(171);
      expect(result.g).toBe(205);
      expect(result.b).toBe(239);
    });

    it('should parse white color', () => {
      const result = parseColor('#ffffff');
      expect(result.r).toBe(255);
      expect(result.g).toBe(255);
      expect(result.b).toBe(255);
    });

    it('should parse black color', () => {
      const result = parseColor('#000000');
      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });
  });

  describe('toRGBA', () => {
    it('should convert RGB to rgba string', () => {
      const result = toRGBA(255, 0, 0, 0.5);
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle full opacity', () => {
      const result = toRGBA(0, 255, 0, 1);
      expect(result).toBe('rgba(0, 255, 0, 1)');
    });

    it('should handle alpha of 0', () => {
      const result = toRGBA(0, 0, 255, 0);
      expect(result).toBe('rgba(0, 0, 255, 0)');
    });

    it('should handle white color', () => {
      const result = toRGBA(255, 255, 255, 1);
      expect(result).toBe('rgba(255, 255, 255, 1)');
    });
  });

  describe('Theme Consistency', () => {
    it('all themes should have valid opacity values between 0 and 1', () => {
      const themes = Object.values(THEME_REGISTRY);
      for (const theme of themes) {
        expect(theme.opacity.head).toBeGreaterThanOrEqual(0);
        expect(theme.opacity.head).toBeLessThanOrEqual(1);
        expect(theme.opacity.body).toBeGreaterThanOrEqual(0);
        expect(theme.opacity.body).toBeLessThanOrEqual(1);
        expect(theme.opacity.tail).toBeGreaterThanOrEqual(0);
        expect(theme.opacity.tail).toBeLessThanOrEqual(1);
      }
    });

    it('all themes should have valid glow intensity between 0 and 1', () => {
      const themes = Object.values(THEME_REGISTRY);
      for (const theme of themes) {
        expect(theme.glow.intensity).toBeGreaterThanOrEqual(0);
        expect(theme.glow.intensity).toBeLessThanOrEqual(1);
      }
    });

    it('all themes should have non-empty trail gradients', () => {
      const themes = Object.values(THEME_REGISTRY);
      for (const theme of themes) {
        expect(theme.trailGradient!.length).toBeGreaterThan(0);
      }
    });
  });
});
