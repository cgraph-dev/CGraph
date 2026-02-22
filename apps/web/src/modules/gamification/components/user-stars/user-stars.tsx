/**
 * UserStars Component
 *
 * Displays user post count indicators using a star-based tier system.
 * Inspired by classic forum software like MyBB/vBulletin.
 *
 * @version 1.0.0
 * @since v0.8.0
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

import { SIZE_CONFIG } from './constants';
import {
  getTierForPostCount,
  getProgressToNextTier,
  getPostsToNextTier,
  starVariants,
  pulseVariants,
} from './utils';
import { CrownIcon } from './crown-icon';
import { StarTooltip } from './star-tooltip';
import type { UserStarsProps } from './types';

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
      <StarTooltip
        tier={tier}
        postCount={postCount}
        progress={progress}
        postsToNext={postsToNext}
      />
    </div>
  );
}

export default UserStars;
