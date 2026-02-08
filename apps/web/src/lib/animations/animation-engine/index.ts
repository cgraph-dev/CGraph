/**
 * Animation Engine - Barrel Export
 *
 * Re-exports all animation engine submodules and types.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

// Re-export types and presets from the types module
export type {
  AnimationConfig,
  SpringConfig,
  GestureConfig,
  SequenceStep,
} from '../AnimationEngine.types';
export { ANIMATION_PRESETS } from '../AnimationEngine.types';

// Re-export submodules
export { SpringPhysics } from './spring-physics';
export { HapticFeedback } from './haptic-feedback';
export { AnimationEngine } from './animation-engine-core';
export { GestureHandler } from './gesture-handler';

// Default export
export { AnimationEngine as default } from './animation-engine-core';
