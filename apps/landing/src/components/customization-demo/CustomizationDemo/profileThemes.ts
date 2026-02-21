/**
 * Profile Theme Configurations
 *
 * All available profile themes organized by category.
 *
 * @module components/landing/CustomizationDemo/profileThemes
 */

import type { ProfileThemeConfig } from './types';

/**
 * All profile themes organized by category
 */
export const profileThemesByCategory: Record<string, ProfileThemeConfig[]> = {
  '8bit': [
    {
      id: '8bit-arcade',
      name: 'Arcade',
      icon: '🕹️',
      tier: 'free',
      background: { type: 'gradient', colors: ['#1a1a2e', '#16213e'] },
      effects: {
        particles: { count: 12, type: 'pixel', behavior: 'rain' },
        overlay: 'scanlines',
        glow: '#00ff00',
      },
      previewDescription: 'Retro pixels',
    },
    {
      id: '8bit-neon',
      name: 'Neon',
      icon: '🌃',
      tier: 'premium',
      background: { type: 'gradient', colors: ['#0f0f0f', '#1a0033', '#330066'] },
      effects: {
        particles: { count: 18, type: 'neon', behavior: 'float' },
        overlay: 'holographic',
        glow: '#ff00ff',
      },
      previewDescription: 'Neon glow',
    },
    {
      id: '8bit-dream',
      name: 'Dreams',
      icon: '👾',
      tier: 'enterprise',
      background: { type: 'animated', colors: ['#ff006e', '#8338ec', '#3a86ff'] },
      effects: {
        particles: { count: 24, type: 'pixel', behavior: 'cascade' },
        overlay: 'scanlines',
        glow: '#00ffff',
      },
      previewDescription: 'Pixel cascade',
    },
  ],
  japanese: [
    {
      id: 'jp-zen',
      name: 'Zen',
      icon: '🎋',
      tier: 'free',
      background: { type: 'gradient', colors: ['#1a3a2e', '#2d5a4a'] },
      effects: {
        particles: { count: 10, type: 'petal', behavior: 'float' },
        glow: '#4ade80',
      },
      previewDescription: 'Zen vibes',
    },
    {
      id: 'jp-sakura',
      name: 'Sakura',
      icon: '🌸',
      tier: 'premium',
      background: { type: 'gradient', colors: ['#ffc0cb', '#ffb3d9'] },
      effects: {
        particles: { count: 20, type: 'petal', behavior: 'cascade' },
        glow: '#ec4899',
      },
      previewDescription: 'Petal rain',
    },
    {
      id: 'jp-wave',
      name: 'Wave',
      icon: '🌊',
      tier: 'enterprise',
      background: { type: 'animated', colors: ['#1e40af', '#3b82f6', '#60a5fa'] },
      effects: {
        particles: { count: 30, type: 'energy', behavior: 'burst' },
        overlay: 'holographic',
        glow: '#3b82f6',
      },
      previewDescription: 'Wave burst',
    },
  ],
  cosmic: [
    {
      id: 'cosmic-nebula',
      name: 'Nebula',
      icon: '🌌',
      tier: 'free',
      background: { type: 'gradient', colors: ['#1a1a2e', '#2d1b4e'] },
      effects: {
        particles: { count: 15, type: 'stars', behavior: 'float' },
        glow: '#8b5cf6',
      },
      previewDescription: 'Star field',
    },
    {
      id: 'cosmic-aurora',
      name: 'Aurora',
      icon: '✨',
      tier: 'premium',
      background: { type: 'gradient', colors: ['#064e3b', '#065f46', '#047857'] },
      effects: {
        particles: { count: 20, type: 'energy', behavior: 'float' },
        glow: '#10b981',
      },
      previewDescription: 'Aurora waves',
    },
    {
      id: 'cosmic-void',
      name: 'Void',
      icon: '🌌',
      tier: 'enterprise',
      background: { type: 'animated', colors: ['#000000', '#1a0033', '#0d0015'] },
      effects: {
        particles: { count: 25, type: 'stars', behavior: 'float' },
        overlay: 'holographic',
        glow: '#8b5cf6',
      },
      previewDescription: 'Void space',
    },
  ],
  kawaii: [
    {
      id: 'kawaii-sweet',
      name: 'Sweet',
      icon: '🍬',
      tier: 'free',
      background: { type: 'gradient', colors: ['#ffc0cb', '#ffb3d9'] },
      effects: {
        particles: { count: 12, type: 'hearts', behavior: 'float' },
        glow: '#ec4899',
      },
      previewDescription: 'Sweet hearts',
    },
    {
      id: 'kawaii-dream',
      name: 'Dream',
      icon: '💖',
      tier: 'premium',
      background: { type: 'gradient', colors: ['#b3e0ff', '#ffffb3', '#ffb3d9'] },
      effects: {
        particles: { count: 20, type: 'stars', behavior: 'float' },
        glow: '#a855f7',
      },
      previewDescription: 'Dream stars',
    },
    {
      id: 'kawaii-magic',
      name: 'Magic',
      icon: '✨',
      tier: 'enterprise',
      background: { type: 'animated', colors: ['#ff69b4', '#9370db', '#87ceeb'] },
      effects: {
        particles: { count: 30, type: 'sparkles', behavior: 'cascade' },
        overlay: 'holographic',
        glow: '#ec4899',
      },
      previewDescription: 'Sparkle magic',
    },
  ],
  kawaii2: [
    {
      id: 'kawaii-pastel',
      name: 'Pastel',
      icon: '🎀',
      tier: 'free',
      background: { type: 'gradient', colors: ['#fce7f3', '#fbcfe8'] },
      effects: {
        particles: { count: 10, type: 'hearts', behavior: 'float' },
        glow: '#f472b6',
      },
      previewDescription: 'Soft pastel',
    },
    {
      id: 'kawaii-candy',
      name: 'Candy',
      icon: '🍭',
      tier: 'premium',
      background: { type: 'gradient', colors: ['#ff6b6b', '#feca57', '#48dbfb'] },
      effects: {
        particles: { count: 18, type: 'sparkles', behavior: 'cascade' },
        glow: '#ff6b6b',
      },
      previewDescription: 'Candy pop',
    },
    {
      id: 'kawaii-rainbow',
      name: 'Rainbow',
      icon: '🦄',
      tier: 'enterprise',
      background: { type: 'animated', colors: ['#ec4899', '#8b5cf6', '#3b82f6'] },
      effects: {
        particles: { count: 36, type: 'stars', behavior: 'burst' },
        overlay: 'holographic',
        glow: '#ec4899',
      },
      previewDescription: 'Rainbow burst',
    },
  ],
};

/**
 * Get profile theme configuration by ID
 */
export function getProfileThemeConfig(themeId: string | undefined): ProfileThemeConfig | null {
  if (!themeId) return null;

  for (const themes of Object.values(profileThemesByCategory)) {
    const found = themes.find((t) => t.id === themeId);
    if (found) return found;
  }

  return null;
}

/**
 * Get themes for a specific category
 */
export function getThemesByCategory(category: string): ProfileThemeConfig[] {
  return profileThemesByCategory[category] || profileThemesByCategory['8bit'] || [];
}
