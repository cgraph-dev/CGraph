/**
 * Constants for AnimatedBadge module
 */

import type { AchievementRarity } from '@/modules/gamification/store';
import type { RarityColorConfig, SizeConfig } from './types';

// ==================== RARITY CONFIGURATIONS ====================

export const RARITY_COLORS: Record<AchievementRarity, RarityColorConfig> = {
  common: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    glow: 'rgba(156, 163, 175, 0.4)',
    gradient: 'from-gray-400 to-gray-500',
    particle: '#9ca3af',
    bg: 'bg-gray-500/10',
  },
  uncommon: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-400 to-green-500',
    particle: '#10b981',
    bg: 'bg-emerald-500/10',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-400 to-indigo-500',
    particle: '#3b82f6',
    bg: 'bg-blue-500/10',
  },
  epic: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.6)',
    gradient: 'from-purple-400 to-violet-500',
    particle: '#8b5cf6',
    bg: 'bg-purple-500/10',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.6)',
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    particle: '#f59e0b',
    bg: 'bg-amber-500/10',
  },
  mythic: {
    primary: '#ec4899',
    secondary: '#db2777',
    glow: 'rgba(236, 72, 153, 0.7)',
    gradient: 'from-pink-400 via-rose-400 to-red-500',
    particle: '#ec4899',
    bg: 'bg-pink-500/10',
  },
};

// ==================== SIZE CONFIGURATIONS ====================

export const SIZE_CONFIG: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', SizeConfig> = {
  xs: { badge: 32, icon: 16, ring: 36, particles: 4 },
  sm: { badge: 40, icon: 20, ring: 44, particles: 6 },
  md: { badge: 56, icon: 28, ring: 62, particles: 8 },
  lg: { badge: 72, icon: 36, ring: 80, particles: 10 },
  xl: { badge: 96, icon: 48, ring: 104, particles: 12 },
};
