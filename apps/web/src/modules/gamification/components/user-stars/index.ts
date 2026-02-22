/**
 * UserStars Module Exports
 *
 * Barrel file for the user stars tier system components.
 */

export { UserStars, default } from './user-stars';
export { UserStarsBadge } from './user-stars-badge';
export { UserStarsTierList } from './user-stars-tier-list';
export { CrownIcon } from './crown-icon';
export { StarTooltip } from './star-tooltip';
export { USER_TIERS, SIZE_CONFIG } from './constants';
export {
  getTierForPostCount,
  getProgressToNextTier,
  getPostsToNextTier,
  starVariants,
  pulseVariants,
} from './utils';
export * from './types';
