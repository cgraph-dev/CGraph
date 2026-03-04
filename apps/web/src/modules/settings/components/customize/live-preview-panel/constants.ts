/**
 * Constants for LivePreviewPanel module
 */

import type { PreviewBadge } from './types';

// Animation speed multipliers
export const ANIMATION_SPEED_MULTIPLIERS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 2,
  normal: 1,
  fast: 0.5,
};

// Sample badges for preview display
export const PREVIEW_BADGES: PreviewBadge[] = [
  { emoji: '🛡️', color: '#f59e0b' },
  { emoji: '⚔️', color: '#8b5cf6' },
  { emoji: '👑', color: '#ec4899' },
];

// Particle color mapping for different theme particle types
export const PARTICLE_COLORS: Record<string, string> = {
  pixel: '#00ff00',
  petal: '#ffb7c5',
  energy: '#8b5cf6',
  neon: '#00ffff',
  smoke: '#374151',
  stars: '#fbbf24',
  hearts: '#ec4899',
  sparkles: '#f59e0b',
  snow: '#e5e7eb',
  rain: '#60a5fa',
  bubbles: '#34d399',
  fire: '#ef4444',
  lightning: '#facc15',
  leaves: '#22c55e',
  confetti: '#8b5cf6',
};

// Legendary/mythic title IDs for fire effect
export const LEGENDARY_TITLE_IDS = ['t5', 't6', 't14', 't15', 't16', 't17', 't18'];
