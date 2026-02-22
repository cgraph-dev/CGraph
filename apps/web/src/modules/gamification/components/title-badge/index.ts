/**
 * TitleBadge Module
 *
 * Modular components for displaying user titles with animations.
 */

// Main components
export { TitleBadge, default } from './title-badge';
export { ProfileTitleDisplay } from './profile-title-display';
export { TitleBadgeTooltip } from './title-badge-tooltip';

// Hooks
export { useAnimationConfig } from './hooks';

// Types
export type { TitleAnimationType, TitleBadgeProps, ProfileTitleDisplayProps } from './types';

// Constants (for consumers who need them)
export { SIZE_CLASSES, RARITY_GRADIENTS, SPARKLE_RARITIES } from './constants';
