import { describe, it, expect } from 'vitest';
import { getBackgroundStyle, getParticleStyle } from '../profile-card-utils';

const defaultColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  glow: '#a78bfa',
  name: '',
};

describe('profile-card-utils', () => {
  describe('getBackgroundStyle', () => {
    it('returns glassmorphism style', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'glassmorphism', blurEnabled: true, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.background).toContain('rgba(17, 24, 39');
      expect(result.backdropFilter).toContain('blur');
    });

    it('returns glassmorphism without blur when disabled', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'glassmorphism', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.backdropFilter).toBe('none');
    });

    it('returns neon style with glow', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'neon', blurEnabled: false, glowEnabled: true },
        defaultColors,
        null
      );
      expect(result.background).toContain('rgba(0, 0, 0');
      expect(result.boxShadow).toContain(defaultColors.glow);
    });

    it('returns neon style without glow', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'neon', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.boxShadow).toBe('none');
    });

    it('returns holographic style', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'holographic', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.background).toContain('linear-gradient');
    });

    it('returns aurora style', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'aurora', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.background).toContain('linear-gradient');
      expect(result.background).toContain(defaultColors.primary);
    });

    it('returns cyberpunk style with clipPath', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'cyberpunk', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.clipPath).toBeDefined();
    });

    it('returns default style for unknown preset', () => {
      const result = getBackgroundStyle(
        { effectPreset: 'unknown', blurEnabled: false, glowEnabled: false },
        defaultColors,
        null
      );
      expect(result.background).toContain('rgba(17, 24, 39');
    });

    it('uses profile theme gradient when available', () => {
      const theme = {
        backgroundGradient: ['#ff0000', '#0000ff'],
        glowEnabled: false,
      };
      const result = getBackgroundStyle(
        { effectPreset: 'glassmorphism', blurEnabled: false, glowEnabled: false },
        defaultColors,
        theme as never
      );
      expect(result.background).toContain('linear-gradient');
      expect(result.background).toContain('#ff0000');
    });

    it('adds glow for profile theme with glow enabled', () => {
      const theme = {
        backgroundGradient: ['#ff0000', '#0000ff'],
        glowEnabled: true,
      };
      const result = getBackgroundStyle(
        { effectPreset: 'glassmorphism', blurEnabled: false, glowEnabled: false },
        defaultColors,
        theme as never
      );
      expect(result.boxShadow).not.toBe('none');
    });
  });

  describe('getParticleStyle', () => {
    it('returns default circle with primary color when no theme', () => {
      const result = getParticleStyle(null, '#ff0000');
      expect(result).toEqual({ color: '#ff0000', shape: 'circle' });
    });

    it('uses theme particle type color when available', () => {
      const theme = { particleType: 'fire' };
      const result = getParticleStyle(theme as never, '#ff0000');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('shape');
    });

    it('returns square shape for pixel particle type', () => {
      const theme = { particleType: 'pixel' };
      const result = getParticleStyle(theme as never, '#ff0000');
      expect(result.shape).toBe('square');
    });
  });
});
