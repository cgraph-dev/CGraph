/**
 * TitleBadge - Re-export from modular implementation
 *
 * This file has been modularized into smaller components.
 * See ./title-badge/ for the full implementation:
 * - TitleBadge.tsx - Main badge component with animations
 * - ProfileTitleDisplay.tsx - Profile title display component
 * - TitleBadgeTooltip.tsx - Tooltip with title info
 * - animations.ts - 25+ animation keyframes
 * - constants.ts - Size and rarity configurations
 * - hooks/useAnimationConfig.ts - Animation configuration hook
 * - types.ts - Type definitions
 */

export { TitleBadge, ProfileTitleDisplay, TitleBadgeTooltip, InlineTitle, default } from './title-badge/index';

export type { TitleAnimationType, TitleBadgeProps, ProfileTitleDisplayProps, InlineTitleProps, InlineTitleData } from './title-badge/index';
