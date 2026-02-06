/**
 * UserStars Component
 *
 * Displays user post count indicators using a star-based tier system.
 * Inspired by classic forum software like MyBB/vBulletin.
 *
 * Modularized into user-stars/ directory:
 * - types.ts: UserStarsTier, UserStarsProps, size types
 * - constants.ts: USER_TIERS config, SIZE_CONFIG
 * - utils.ts: getTierForPostCount, progress calculations, animation variants
 * - CrownIcon.tsx: SVG crown for Ultimate tier
 * - StarTooltip.tsx: Hover tooltip with tier info
 * - UserStars.tsx: Main component
 * - UserStarsBadge.tsx: Compact badge variant
 * - UserStarsTierList.tsx: All tiers display for help pages
 *
 * @version 1.0.0
 * @since v0.8.0
 */
export { default } from './user-stars';
export * from './user-stars';
