/**
 * UserStars Component
 *
 * Displays user post count indicators using a star-based tier system.
 * Inspired by classic forum software like MyBB/vBulletin.
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
 *
 * @version 1.0.0
 * @since v0.8.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// =============================================================================
// TYPES
// =============================================================================

export interface UserStarsTier {
  name: string;
  minPosts: number;
  maxPosts: number | null;
  stars: number;
  isGold: boolean;
  hasCrown: boolean;
  color: string;
  glowColor: string;
  description: string;
}

export interface UserStarsProps {
  /** Total number of posts/contributions by the user */
  postCount: number;
  /** Whether to show the tier name label */
  showLabel?: boolean;
  /** Whether to show the exact post count */
  showCount?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to animate the stars */
  animated?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode - just stars, no tooltip */
  compact?: boolean;
}

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

const USER_TIERS: UserStarsTier[] = [
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
  return USER_TIERS[0] as UserStarsTier;
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

// =============================================================================
// SIZE CONFIGURATIONS
// =============================================================================

const SIZE_CONFIG = {
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

// =============================================================================
// CROWN SVG COMPONENT
// =============================================================================

function CrownIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 1L15.09 7.26L22 8.27L17 13.14L18.18 20.02L12 16.77L5.82 20.02L7 13.14L2 8.27L8.91 7.26L12 1Z" />
    </svg>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function UserStars({
  postCount,
  showLabel = false,
  showCount = false,
  size = 'sm',
  animated = true,
  className = '',
  compact = false,
}: UserStarsProps) {
  const tier = useMemo(() => getTierForPostCount(postCount), [postCount]);
  const sizeConfig = SIZE_CONFIG[size];
  const progress = useMemo(() => getProgressToNextTier(postCount), [postCount]);
  const postsToNext = useMemo(() => getPostsToNextTier(postCount), [postCount]);

  // Animation variants
  const starVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -180 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: i * 0.1,
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      },
    }),
    hover: {
      scale: 1.2,
      rotate: 15,
      transition: { type: 'spring' as const, stiffness: 400 },
    },
  };

  const pulseVariants = {
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

  // Render stars
  const renderStars = () => {
    const stars = [];

    // Add crown for Ultimate tier
    if (tier.hasCrown) {
      stars.push(
        <motion.div
          key="crown"
          custom={0}
          initial={animated ? 'hidden' : false}
          animate="visible"
          whileHover={animated ? 'hover' : undefined}
          variants={starVariants}
          className="relative"
        >
          <CrownIcon
            className={sizeConfig.crown}
            style={{
              color: tier.color,
              filter: `drop-shadow(0 0 4px ${tier.glowColor})`,
            }}
          />
        </motion.div>
      );
    }

    // Add stars based on tier
    for (let i = 0; i < tier.stars; i++) {
      const StarComponent = tier.isGold ? StarSolid : StarSolid;

      stars.push(
        <motion.div
          key={`star-${i}`}
          custom={tier.hasCrown ? i + 1 : i}
          initial={animated ? 'hidden' : false}
          animate={tier.isGold && animated ? ['visible', 'animate'] : 'visible'}
          whileHover={animated ? 'hover' : undefined}
          variants={tier.isGold ? { ...starVariants, ...pulseVariants } : starVariants}
          className="relative"
        >
          <StarComponent
            className={sizeConfig.star}
            style={{
              color: tier.color,
              filter: tier.isGold
                ? `drop-shadow(0 0 6px ${tier.glowColor})`
                : `drop-shadow(0 0 2px ${tier.glowColor})`,
            }}
          />
        </motion.div>
      );
    }

    // Show empty stars for newcomers
    if (tier.stars === 0) {
      stars.push(
        <motion.div
          key="empty"
          initial={animated ? { opacity: 0 } : false}
          animate={{ opacity: 0.5 }}
          className="flex items-center gap-0.5"
        >
          <StarOutline className={`${sizeConfig.star} text-gray-600`} />
        </motion.div>
      );
    }

    return stars;
  };

  if (compact) {
    return (
      <div className={`flex items-center ${sizeConfig.gap} ${className}`}>{renderStars()}</div>
    );
  }

  return (
    <div className={`group relative inline-flex items-center ${className}`}>
      {/* Stars Container */}
      <div className={`flex items-center ${sizeConfig.gap} ${sizeConfig.container}`}>
        {renderStars()}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={`ml-2 font-medium ${sizeConfig.text}`} style={{ color: tier.color }}>
          {tier.name}
        </span>
      )}

      {/* Post Count */}
      {showCount && (
        <span className={`ml-2 text-gray-500 ${sizeConfig.text}`}>
          ({postCount.toLocaleString()} posts)
        </span>
      )}

      {/* Tooltip on Hover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: tier.color }}>
              {tier.name}
            </span>
            {tier.isGold && (
              <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
                GOLD
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">{tier.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium text-gray-300">{postCount.toLocaleString()}</span> posts
          </div>
          {postsToNext !== null && (
            <>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">Next tier</span>
                  <span className="text-gray-400">{progress}%</span>
                </div>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-dark-600">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tier.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {postsToNext.toLocaleString()} posts to next tier
                </p>
              </div>
            </>
          )}
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-dark-800" />
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT BADGE VARIANT
// =============================================================================

export function UserStarsBadge({
  postCount,
  size = 'sm',
}: {
  postCount: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const tier = getTierForPostCount(postCount);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        backgroundColor: `${tier.color}20`,
        border: `1px solid ${tier.color}40`,
      }}
    >
      <UserStars postCount={postCount} size={size} compact animated={false} />
      <span className="text-xs font-medium" style={{ color: tier.color }}>
        {tier.name}
      </span>
    </div>
  );
}

// =============================================================================
// ALL TIERS DISPLAY (for documentation/help pages)
// =============================================================================

export function UserStarsTierList() {
  return (
    <div className="space-y-2">
      {USER_TIERS.map((tier) => (
        <div
          key={tier.name}
          className="flex items-center justify-between rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <UserStars postCount={tier.minPosts} size="md" compact animated={false} />
            <div>
              <span className="font-medium" style={{ color: tier.color }}>
                {tier.name}
              </span>
              <p className="text-sm text-gray-500">{tier.description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            {tier.maxPosts
              ? `${tier.minPosts.toLocaleString()} - ${tier.maxPosts.toLocaleString()}`
              : `${tier.minPosts.toLocaleString()}+`}
            <span className="ml-1 text-gray-600">posts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserStars;

// =============================================================================
// EXPORTS
// =============================================================================

export { USER_TIERS };
