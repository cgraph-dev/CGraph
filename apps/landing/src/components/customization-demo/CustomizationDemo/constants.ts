/**
 * Constants for CustomizationDemo
 *
 * @module components/landing/CustomizationDemo/constants
 */

import type { ThemePreset, AvatarBorderType, ThemeColorConfig, AvatarBorderConfig } from './types';

// =============================================================================
// THEME COLORS
// =============================================================================

export const themeColors: Record<ThemePreset, ThemeColorConfig> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.5)',
    name: 'Emerald',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.5)',
    name: 'Purple',
  },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.5)', name: 'Cyan' },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.5)',
    name: 'Orange',
  },
  pink: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236, 72, 153, 0.5)', name: 'Pink' },
  gold: { primary: '#eab308', secondary: '#facc15', glow: 'rgba(234, 179, 8, 0.5)', name: 'Gold' },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.5)',
    name: 'Crimson',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.5)',
    name: 'Arctic',
  },
};

// =============================================================================
// AVATAR BORDER DEFINITIONS
// =============================================================================

export const avatarBorders: Record<AvatarBorderType, AvatarBorderConfig> = {
  none: { name: 'None', description: 'No border', premium: false },
  static: { name: 'Static', description: 'Simple colored border', premium: false },
  glow: { name: 'Glow', description: 'Soft glowing effect', premium: false },
  pulse: { name: 'Pulse', description: 'Rhythmic pulsing glow', premium: false },
  rotate: { name: 'Orbit', description: 'Rotating gradient ring', premium: true, rarity: 'Rare' },
  fire: { name: 'Inferno', description: 'Animated flame effect', premium: true, rarity: 'Epic' },
  ice: { name: 'Frost', description: 'Crystalline ice particles', premium: true, rarity: 'Epic' },
  electric: {
    name: 'Storm',
    description: 'Electric sparks and arcs',
    premium: true,
    rarity: 'Epic',
  },
  legendary: {
    name: 'Legendary',
    description: 'Multi-layered animated aura',
    premium: true,
    rarity: 'Legendary',
  },
  mythic: {
    name: 'Mythic',
    description: 'Reality-bending void effect',
    premium: true,
    rarity: 'Mythic',
  },
};

export const rarityColors: Record<string, string> = {
  Rare: '#3b82f6',
  Epic: '#8b5cf6',
  Legendary: '#f97316',
  Mythic: '#ec4899',
};
