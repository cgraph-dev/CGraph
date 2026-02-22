/**
 * Profile Theme Card Module
 *
 * Interactive profile theme preview cards with animated backgrounds,
 * particle effects, holographic shine, tier badges, and lock overlays.
 *
 * @module modules/settings/components/customize/profile-theme-card
 */

// Main component
export { default } from './profile-theme-card';

// Sub-components
export { ProfileThemeGrid } from './profile-theme-grid';
export { default as PreviewCard } from './preview-card';
export { default as LockOverlay } from './lock-overlay';
export { default as SelectedIndicator } from './selected-indicator';
export { default as ThemeEffects } from './theme-effects';
export { default as TierBadge } from './tier-badge';

// Hooks
export { useParticles } from './useParticles';
export { getBackgroundAnimation, getOverlayStyles, getParticleAnimation } from './useThemeEffects';

// Types
export type { ProfileThemeCardProps, ProfileThemeGridProps, Particle } from './types';

// Constants
export { CATEGORY_ICONS, COL_CLASSES } from './constants';
