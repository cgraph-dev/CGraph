/**
 * ProfilePreview Module
 *
 * Exports profile preview components for the customization demo.
 */

// Main component
export { ProfilePreview } from './ProfilePreview';

// Card variants
export { MinimalProfileCard } from './MinimalProfileCard';
export { DetailedProfileCard } from './DetailedProfileCard';
export { CompactProfileCard } from './CompactProfileCard';
export { ExpandedProfileCard } from './ExpandedProfileCard';
export { GamingProfileCard } from './GamingProfileCard';

// Types and constants
export type { ThemeColors, CardProps, MockBadge } from './types';
export { MOCK_BADGES, getBadgeGlow } from './constants';
