/**
 * Constants for AnimatedAvatar
 * @module components/ui/animated-avatar
 */

import type { AvatarStyle, BorderStyleInfo } from './types';

export const defaultAvatarStyle: AvatarStyle = {
  borderStyle: 'gradient',
  borderWidth: 3,
  borderColor: '#10b981',
  secondaryColor: '#8b5cf6',
  glowIntensity: 50,
  animationSpeed: 'normal',
  shape: 'circle',
  particleEffect: 'none',
  pulseOnHover: true,
  showLevel: false,
  levelBadgeStyle: 'default',
};

export const DEFAULT_OWNED_STYLES = ['none', 'solid', 'gradient', 'pulse'] as const;

// Border style metadata for shop/settings
export const BORDER_STYLES: BorderStyleInfo[] = [
  // Free
  {
    id: 'none',
    name: 'None',
    category: 'free',
    description: 'No border',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'solid',
    name: 'Solid',
    category: 'free',
    description: 'Simple solid border',
    coinPrice: 0,
    preview: 'border-2 border-current',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    category: 'free',
    description: 'Smooth gradient border',
    coinPrice: 0,
    preview: 'bg-gradient-to-r from-primary-500 to-purple-500',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'free',
    description: 'Gentle pulsing animation',
    coinPrice: 0,
    preview: 'animate-pulse',
  },

  // Premium
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'premium',
    description: 'Cycling rainbow colors',
    coinPrice: 500,
    preview: '',
  },
  {
    id: 'spin',
    name: 'Spinning',
    category: 'premium',
    description: 'Rotating gradient border',
    coinPrice: 600,
    preview: '',
  },
  {
    id: 'glow',
    name: 'Soft Glow',
    category: 'premium',
    description: 'Ethereal glowing effect',
    coinPrice: 700,
    preview: '',
  },
  {
    id: 'neon',
    name: 'Neon Sign',
    category: 'premium',
    description: 'Retro neon light effect',
    coinPrice: 800,
    preview: '',
  },
  {
    id: 'fire',
    name: 'Inferno',
    category: 'premium',
    description: 'Blazing fire effect',
    coinPrice: 900,
    preview: '',
  },
  {
    id: 'electric',
    name: 'Electric',
    category: 'premium',
    description: 'Crackling electricity',
    coinPrice: 900,
    preview: '',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    category: 'premium',
    description: 'Northern lights shimmer',
    coinPrice: 1000,
    preview: '',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    category: 'premium',
    description: 'Energetic plasma waves',
    coinPrice: 1100,
    preview: '',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Dust',
    category: 'premium',
    description: 'Starry cosmic effect',
    coinPrice: 1200,
    preview: '',
  },
  {
    id: 'matrix',
    name: 'Digital Rain',
    category: 'premium',
    description: 'Matrix-style data rain',
    coinPrice: 1200,
    preview: '',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    category: 'premium',
    description: 'Prismatic holographic shift',
    coinPrice: 1500,
    preview: '',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'premium',
    description: 'Brilliant diamond sparkle',
    coinPrice: 1500,
    preview: '',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    category: 'premium',
    description: 'Lush emerald glow',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'premium',
    description: 'Deep ruby radiance',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    category: 'premium',
    description: 'Ocean blue brilliance',
    coinPrice: 1300,
    preview: '',
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    category: 'premium',
    description: 'Mystical purple aura',
    coinPrice: 1300,
    preview: '',
  },

  // Legendary
  {
    id: 'supernova',
    name: 'Supernova',
    category: 'legendary',
    description: 'Explosive stellar burst',
    coinPrice: 3000,
    preview: '',
  },
  {
    id: 'black_hole',
    name: 'Event Horizon',
    category: 'legendary',
    description: 'Gravitational distortion',
    coinPrice: 3500,
    preview: '',
  },
  {
    id: 'quantum',
    name: 'Quantum Flux',
    category: 'legendary',
    description: 'Reality-bending particles',
    coinPrice: 4000,
    preview: '',
  },
  {
    id: 'void',
    name: 'Void Walker',
    category: 'legendary',
    description: 'Dark matter emanation',
    coinPrice: 4500,
    preview: '',
  },
  {
    id: 'celestial',
    name: 'Celestial',
    category: 'legendary',
    description: 'Heavenly divine light',
    coinPrice: 5000,
    preview: '',
  },

  // Limited
  {
    id: 'anniversary',
    name: 'Anniversary',
    category: 'limited',
    description: 'Special anniversary edition',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'founders',
    name: 'Founders',
    category: 'limited',
    description: 'Exclusive to early adopters',
    coinPrice: 0,
    preview: '',
  },
  {
    id: 'champion',
    name: 'Champion',
    category: 'limited',
    description: 'Leaderboard top 3 reward',
    coinPrice: 0,
    preview: '',
  },
];

export const SIZE_CONFIG = {
  xs: { container: 'h-6 w-6', text: '0.6rem', badge: 'h-2 w-2', levelSize: '8px' },
  sm: { container: 'h-8 w-8', text: '0.75rem', badge: 'h-2.5 w-2.5', levelSize: '10px' },
  md: { container: 'h-10 w-10', text: '0.875rem', badge: 'h-3 w-3', levelSize: '12px' },
  lg: { container: 'h-12 w-12', text: '1rem', badge: 'h-3.5 w-3.5', levelSize: '14px' },
  xl: { container: 'h-16 w-16', text: '1.25rem', badge: 'h-4 w-4', levelSize: '16px' },
  '2xl': { container: 'h-24 w-24', text: '1.75rem', badge: 'h-5 w-5', levelSize: '20px' },
  '3xl': { container: 'h-32 w-32', text: '2.25rem', badge: 'h-6 w-6', levelSize: '24px' },
} as const;

export const STATUS_COLORS = {
  online: { bg: 'bg-green-500', glow: 'rgba(34, 197, 94, 0.6)' },
  idle: { bg: 'bg-yellow-500', glow: 'rgba(234, 179, 8, 0.6)' },
  dnd: { bg: 'bg-red-500', glow: 'rgba(239, 68, 68, 0.6)' },
  offline: { bg: 'bg-gray-500', glow: 'transparent' },
} as const;

export const ANIMATION_DURATIONS = {
  none: 0,
  slow: 6,
  normal: 3,
  fast: 1.5,
  ultra: 0.75,
} as const;
