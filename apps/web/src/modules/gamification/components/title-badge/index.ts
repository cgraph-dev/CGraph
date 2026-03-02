/**
 * TitleBadge Module
 *
 * Modular components for displaying user titles with animations.
 */

// Main components
export { TitleBadge, default } from './title-badge';
export { ProfileTitleDisplay } from './profile-title-display';
export { TitleBadgeTooltip } from './title-badge-tooltip';
export { InlineTitle } from './inline-title';
export { TitleDisplay } from './title-display';

// Hooks
export { useAnimationConfig } from './hooks';

// Types
export type { TitleAnimationType, TitleBadgeProps, ProfileTitleDisplayProps } from './types';
export type { InlineTitleProps, InlineTitleData } from './inline-title';
export type { TitleDisplayProps } from './title-display';

// Constants (for consumers who need them)
export { SIZE_CLASSES, RARITY_GRADIENTS, SPARKLE_RARITIES } from './constants';
