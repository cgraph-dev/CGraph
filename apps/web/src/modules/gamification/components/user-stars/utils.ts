/**
 * UserStars Utilities
 *
 * Helper functions for tier calculations and progress tracking.
 */

import type { UserStarsTier } from './types';
import { USER_TIERS } from './constants';
import { springs } from '@/lib/animation-presets';

/**
 * Get the tier for a given post count
 */
export function getTierForPostCount(postCount: number): UserStarsTier {
  for (let i = USER_TIERS.length - 1; i >= 0; i--) {
    const tier = USER_TIERS[i];
    if (tier && postCount >= tier.minPosts) {
      return tier;
    }
  }
  // Fallback to first tier - guaranteed to exist
  return USER_TIERS[0] as UserStarsTier; // type assertion: array element type from indexed access
}

/**
 * Get progress to next tier (0-100)
 */
export function getProgressToNextTier(postCount: number): number {
  const currentTier = getTierForPostCount(postCount);
  const currentIndex = USER_TIERS.findIndex((t) => t.name === currentTier.name);

  if (currentIndex >= USER_TIERS.length - 1 || currentIndex === -1) {
    return 100; // Max tier
  }

  const nextTier = USER_TIERS[currentIndex + 1];
  if (!nextTier) return 100;

  const postsInCurrentTier = postCount - currentTier.minPosts;
  const postsNeededForNext = nextTier.minPosts - currentTier.minPosts;

  return Math.min(100, Math.round((postsInCurrentTier / postsNeededForNext) * 100));
}

/**
 * Get posts remaining until next tier
 */
export function getPostsToNextTier(postCount: number): number | null {
  const currentTier = getTierForPostCount(postCount);
  const currentIndex = USER_TIERS.findIndex((t) => t.name === currentTier.name);

  if (currentIndex >= USER_TIERS.length - 1 || currentIndex === -1) {
    return null; // Max tier
  }

  const nextTier = USER_TIERS[currentIndex + 1];
  if (!nextTier) return null;

  return nextTier.minPosts - postCount;
}

/**
 * Animation variants for stars
 */
export const starVariants = {
  hidden: { scale: 0, opacity: 0, rotate: -180 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      delay: i * 0.1,
      ...springs.default,
    },
  }),
  hover: {
    scale: 1.2,
    rotate: 15,
    transition: springs.snappy,
  },
};

/**
 * Pulse animation for gold stars
 */
export const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
};
