/**
 * themed-border-card barrel exports
 *
 * Modularized ThemedBorderCard following Google/Meta coding standards
 */

// Main component
export { default, default as ThemedBorderCard } from './ThemedBorderCard';

// Sub-components
export { BorderCardGrid } from './BorderCardGrid';
export { CornerBrackets } from './CornerBrackets';
export { ParticleEffects } from './ParticleEffects';

// Animations
export { getBorderAnimation } from './animations';

// Types
export type {
  ThemedBorderCardProps,
  SizeConfig,
  BorderAnimationResult,
  BorderCardGridProps,
} from './types';

// Constants
export { SIZE_CONFIG, COLUMN_CLASSES, PARTICLE_ANIMATION_TYPES } from './constants';
