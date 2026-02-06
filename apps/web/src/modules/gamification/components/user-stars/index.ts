/**
 * UserStars Module Exports
 *
 * Barrel file for the user stars tier system components.
 */

export { UserStars, default } from './UserStars';
export { UserStarsBadge } from './UserStarsBadge';
export { UserStarsTierList } from './UserStarsTierList';
export { CrownIcon } from './CrownIcon';
export { StarTooltip } from './StarTooltip';
export { USER_TIERS, SIZE_CONFIG } from './constants';
export {
  getTierForPostCount,
  getProgressToNextTier,
  getPostsToNextTier,
  starVariants,
  pulseVariants,
} from './utils';
export * from './types';
