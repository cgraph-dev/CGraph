/**
 * UserStars Constants
 *
 * Tier configuration and size settings for the user stars system.
 *
 * Tier System (configurable):
 * - Newcomer (0-9 posts): 0 stars
 * - Member (10-49 posts): 1 star
 * - Active Member (50-99 posts): 2 stars
 * - Established (100-249 posts): 3 stars
 * - Senior (250-499 posts): 4 stars
 * - Veteran (500-999 posts): 5 stars
 * - Elite (1000-2499 posts): 1 gold star
 * - Legend (2500-4999 posts): 2 gold stars
 * - Champion (5000-9999 posts): 3 gold stars
 * - Ultimate (10000+ posts): 5 gold stars + crown
 */

import type { UserStarsTier, SizeConfig, UserStarsSize } from './types';

/**
 * User tier definitions
 */
export const USER_TIERS: UserStarsTier[] = [
  {
    name: 'Newcomer',
    minPosts: 0,
    maxPosts: 9,
    stars: 0,
    isGold: false,
    hasCrown: false,
    color: '#6B7280', // gray-500
    glowColor: 'rgba(107, 114, 128, 0.3)',
    description: 'Just getting started',
  },
  {
    name: 'Member',
    minPosts: 10,
    maxPosts: 49,
    stars: 1,
    isGold: false,
    hasCrown: false,
    color: '#10B981', // emerald-500
    glowColor: 'rgba(16, 185, 129, 0.3)',
    description: 'Regular contributor',
  },
  {
    name: 'Active',
    minPosts: 50,
    maxPosts: 99,
    stars: 2,
    isGold: false,
    hasCrown: false,
    color: '#3B82F6', // blue-500
    glowColor: 'rgba(59, 130, 246, 0.3)',
    description: 'Active community member',
  },
  {
    name: 'Established',
    minPosts: 100,
    maxPosts: 249,
    stars: 3,
    isGold: false,
    hasCrown: false,
    color: '#8B5CF6', // purple-500
    glowColor: 'rgba(139, 92, 246, 0.3)',
    description: 'Well-known in the community',
  },
  {
    name: 'Senior',
    minPosts: 250,
    maxPosts: 499,
    stars: 4,
    isGold: false,
    hasCrown: false,
    color: '#EC4899', // pink-500
    glowColor: 'rgba(236, 72, 153, 0.3)',
    description: 'Experienced contributor',
  },
  {
    name: 'Veteran',
    minPosts: 500,
    maxPosts: 999,
    stars: 5,
    isGold: false,
    hasCrown: false,
    color: '#F59E0B', // amber-500
    glowColor: 'rgba(245, 158, 11, 0.3)',
    description: 'Long-time community veteran',
  },
  {
    name: 'Elite',
    minPosts: 1000,
    maxPosts: 2499,
    stars: 1,
    isGold: true,
    hasCrown: false,
    color: '#FFD700', // gold
    glowColor: 'rgba(255, 215, 0, 0.4)',
    description: 'Elite status achieved',
  },
  {
    name: 'Legend',
    minPosts: 2500,
    maxPosts: 4999,
    stars: 2,
    isGold: true,
    hasCrown: false,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    description: 'Legendary contributor',
  },
  {
    name: 'Champion',
    minPosts: 5000,
    maxPosts: 9999,
    stars: 3,
    isGold: true,
    hasCrown: false,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    description: 'Community champion',
  },
  {
    name: 'Ultimate',
    minPosts: 10000,
    maxPosts: null,
    stars: 5,
    isGold: true,
    hasCrown: true,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    description: 'Ultimate legendary status',
  },
];

/**
 * Size configuration mapping
 */
export const SIZE_CONFIG: Record<UserStarsSize, SizeConfig> = {
  xs: {
    star: 'h-3 w-3',
    crown: 'h-3 w-3',
    gap: 'gap-0.5',
    text: 'text-xs',
    container: 'h-4',
  },
  sm: {
    star: 'h-4 w-4',
    crown: 'h-4 w-4',
    gap: 'gap-0.5',
    text: 'text-sm',
    container: 'h-5',
  },
  md: {
    star: 'h-5 w-5',
    crown: 'h-5 w-5',
    gap: 'gap-1',
    text: 'text-base',
    container: 'h-6',
  },
  lg: {
    star: 'h-6 w-6',
    crown: 'h-6 w-6',
    gap: 'gap-1',
    text: 'text-lg',
    container: 'h-7',
  },
};
