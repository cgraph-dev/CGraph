/**
 * Animated Avatar Module
 *
 * Highly customizable avatar component with 30+ border styles,
 * animated effects (rainbow, fire, cosmic, etc.), particle systems,
 * level badges, and a full style picker UI. Persisted via Zustand store.
 *
 * @module components/ui/animated-avatar
 */

// Main component
export { default as AnimatedAvatar, default } from './AnimatedAvatar';

// Sub-components
export { AvatarStylePicker } from './AvatarStylePicker';

// Store
export { useAvatarStyle } from './store';

// Animations
export {
  getShapeStyles,
  getBorderGradient,
  getAnimationProps,
  getParticleEmoji,
} from './animations';

// Types
export type {
  AnimationReturn,
  BorderCategory,
  BorderStyleType,
  AvatarStyle,
  BorderStyleInfo,
  AnimatedAvatarProps,
  AvatarStyleStore,
} from './types';

// Constants
export {
  defaultAvatarStyle,
  BORDER_STYLES,
  SIZE_CONFIG,
  STATUS_COLORS,
  ANIMATION_DURATIONS,
} from './constants';
