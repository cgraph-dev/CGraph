/**
 * GlassCard V2 - Variant & Depth Configurations
 *
 * Static configuration maps for the 10 glassmorphism variants
 * and 4 depth shadow presets.
 */

import type { ViewStyle } from 'react-native';
import type { GlassVariant, VariantConfig } from './glass-card-v2.types';

export const VARIANT_CONFIGS: Record<GlassVariant, VariantConfig> = {
  default: {
    blurStyle: 'standard',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderColors: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)'],
    glowColor: '#ffffff',
    overlayGradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)'],
    scanlineColor: 'rgba(255, 255, 255, 0.05)',
  },
  frosted: {
    blurStyle: 'frosted',
    backgroundColor: 'rgba(40, 50, 70, 0.7)',
    borderColors: ['rgba(100, 150, 200, 0.3)', 'rgba(100, 150, 200, 0.1)'],
    glowColor: '#87ceeb',
    overlayGradient: ['rgba(200, 220, 255, 0.15)', 'rgba(200, 220, 255, 0)'],
    scanlineColor: 'rgba(200, 220, 255, 0.05)',
  },
  crystal: {
    blurStyle: 'crystal',
    backgroundColor: 'rgba(20, 30, 25, 0.6)',
    borderColors: ['rgba(16, 185, 129, 0.4)', 'rgba(139, 92, 246, 0.3)'],
    glowColor: '#10b981',
    overlayGradient: ['rgba(16, 185, 129, 0.15)', 'rgba(139, 92, 246, 0.1)'],
    scanlineColor: 'rgba(16, 185, 129, 0.08)',
  },
  neon: {
    blurStyle: 'neon',
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    borderColors: ['#00ffff', '#ff00ff', '#00ffff'],
    glowColor: '#00ffff',
    overlayGradient: ['rgba(0, 255, 255, 0.1)', 'rgba(255, 0, 255, 0.05)'],
    scanlineColor: 'rgba(0, 255, 255, 0.1)',
  },
  holographic: {
    blurStyle: 'holographic',
    backgroundColor: 'rgba(20, 20, 30, 0.65)',
    borderColors: ['#ff0080', '#ff8c00', '#ffff00', '#00ff00', '#00ffff', '#ff0080'],
    glowColor: '#ff00ff',
    overlayGradient: ['rgba(255, 0, 255, 0.1)', 'rgba(0, 255, 255, 0.1)'],
    scanlineColor: 'rgba(0, 255, 255, 0.08)',
  },
  aurora: {
    blurStyle: 'aurora',
    backgroundColor: 'rgba(10, 15, 30, 0.7)',
    borderColors: ['#10b981', '#06b6d4', '#8b5cf6', '#10b981'],
    glowColor: '#10b981',
    overlayGradient: ['rgba(0, 255, 170, 0.1)', 'rgba(100, 50, 200, 0.1)'],
    scanlineColor: 'rgba(0, 255, 200, 0.06)',
  },
  midnight: {
    blurStyle: 'midnight',
    backgroundColor: 'rgba(10, 10, 25, 0.85)',
    borderColors: ['rgba(80, 80, 160, 0.3)', 'rgba(40, 40, 80, 0.2)'],
    glowColor: '#6366f1',
    overlayGradient: ['rgba(80, 80, 160, 0.1)', 'rgba(40, 40, 80, 0.05)'],
    scanlineColor: 'rgba(100, 100, 200, 0.05)',
  },
  dawn: {
    blurStyle: 'dawn',
    backgroundColor: 'rgba(50, 30, 40, 0.7)',
    borderColors: ['#f97316', '#ec4899', '#f97316'],
    glowColor: '#f97316',
    overlayGradient: ['rgba(255, 150, 100, 0.12)', 'rgba(255, 100, 150, 0.08)'],
    scanlineColor: 'rgba(255, 150, 100, 0.06)',
  },
  ember: {
    blurStyle: 'ember',
    backgroundColor: 'rgba(30, 15, 10, 0.8)',
    borderColors: ['#fbbf24', '#f97316', '#dc2626', '#fbbf24'],
    glowColor: '#f97316',
    overlayGradient: ['rgba(255, 150, 50, 0.15)', 'rgba(200, 50, 50, 0.1)'],
    scanlineColor: 'rgba(255, 100, 50, 0.08)',
  },
  ocean: {
    blurStyle: 'ocean',
    backgroundColor: 'rgba(15, 30, 50, 0.75)',
    borderColors: ['#06b6d4', '#3b82f6', '#06b6d4'],
    glowColor: '#06b6d4',
    overlayGradient: ['rgba(0, 150, 255, 0.12)', 'rgba(50, 100, 200, 0.08)'],
    scanlineColor: 'rgba(0, 200, 255, 0.06)',
  },
};

export const DEPTH_SHADOWS: Record<string, ViewStyle[]> = {
  flat: [],
  shallow: [{ shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, shadowOpacity: 0.1 }],
  medium: [
    { shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, shadowOpacity: 0.1 },
    { shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0.08 },
  ],
  deep: [
    { shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, shadowOpacity: 0.1 },
    { shadowOffset: { width: 0, height: 12 }, shadowRadius: 20, shadowOpacity: 0.15 },
    { shadowOffset: { width: 0, height: 20 }, shadowRadius: 40, shadowOpacity: 0.1 },
  ],
};
