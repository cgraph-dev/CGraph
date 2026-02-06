/**
 * Profile Theme Card Module
 *
 * Interactive profile theme preview cards with animated backgrounds,
 * particle effects, holographic shine, tier badges, and lock overlays.
 *
 * @module modules/settings/components/customize/profile-theme-card
 */

// Main component
export { default } from './ProfileThemeCard';

// Sub-components
export { ProfileThemeGrid } from './ProfileThemeGrid';
export { default as PreviewCard } from './PreviewCard';
export { default as LockOverlay } from './LockOverlay';
export { default as SelectedIndicator } from './SelectedIndicator';
export { default as ThemeEffects } from './ThemeEffects';
export { default as TierBadge } from './TierBadge';

// Hooks
export { useParticles } from './useParticles';
export { getBackgroundAnimation, getOverlayStyles, getParticleAnimation } from './useThemeEffects';

// Types
export type { ProfileThemeCardProps, ProfileThemeGridProps, Particle } from './types';

// Constants
export { CATEGORY_ICONS, COL_CLASSES } from './constants';
