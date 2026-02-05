/**
 * TitleBadge Module
 *
 * Modular components for displaying user titles with animations.
 */

// Main components
export { TitleBadge, default } from './TitleBadge';
export { ProfileTitleDisplay } from './ProfileTitleDisplay';
export { TitleBadgeTooltip } from './TitleBadgeTooltip';

// Hooks
export { useAnimationConfig } from './hooks';

// Types
export type { TitleAnimationType, TitleBadgeProps, ProfileTitleDisplayProps } from './types';

// Constants (for consumers who need them)
export { SIZE_CLASSES, RARITY_GRADIENTS, SPARKLE_RARITIES } from './constants';
