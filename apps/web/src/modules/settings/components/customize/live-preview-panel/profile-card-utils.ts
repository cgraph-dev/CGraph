/**
 * Utility functions for ProfileCardPreview
 */

import { PARTICLE_COLORS } from './constants';
import type { ParticleStyle } from './types';
import type { ThemeColors } from './types';
import type { ProfileThemeConfig } from '@/data/profileThemes';

interface BackgroundSettings {
  effectPreset: string;
  blurEnabled: boolean;
  glowEnabled: boolean;
}

/**
 * Returns the CSS style object for the profile card background
 * based on the active theme and effect preset.
 */
export function getBackgroundStyle(
  settings: BackgroundSettings,
  colors: ThemeColors,
  activeProfileTheme: ProfileThemeConfig | null
): Record<string, string> {
  if (activeProfileTheme?.backgroundGradient && activeProfileTheme.backgroundGradient.length > 0) {
    const gradientColors = activeProfileTheme.backgroundGradient.join(', ');
    return {
      background: `linear-gradient(135deg, ${gradientColors})`,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: activeProfileTheme.glowEnabled ? `0 0 40px ${colors.primary}40` : 'none',
    };
  }

   
  const bgEffect = settings.effectPreset as string; // type assertion: effectPreset is already string, explicit for switch narrowing

  switch (bgEffect) {
    case 'glassmorphism':
      return {
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: settings.blurEnabled ? 'blur(20px)' : 'none',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      };
    case 'neon':
      return {
        background: 'rgba(0, 0, 0, 0.9)',
        border: `1px solid ${colors.primary}`,
        boxShadow: settings.glowEnabled
          ? `0 0 30px ${colors.glow}, inset 0 0 30px ${colors.glow}20`
          : 'none',
      };
    case 'holographic':
      return {
        background: `linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
      };
    case 'aurora':
      return {
        background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      };
    case 'cyberpunk':
      return {
        background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)',
        border: `1px solid ${colors.primary}80`,
        clipPath:
          'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
      };
    default:
      return {
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      };
  }
}

/**
 * Returns the particle style (color and shape) based on the active profile theme.
 */
export function getParticleStyle(
  activeProfileTheme: ProfileThemeConfig | null,
  primaryColor: string
): ParticleStyle {
  if (activeProfileTheme?.particleType) {
    return {
      color: PARTICLE_COLORS[activeProfileTheme.particleType] || primaryColor,
      shape: activeProfileTheme.particleType === 'pixel' ? 'square' : 'circle',
    };
  }
  return { color: primaryColor, shape: 'circle' };
}
