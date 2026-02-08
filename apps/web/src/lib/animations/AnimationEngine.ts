/**
 * Advanced Animation Engine
 *
 * Thin re-export barrel — all implementation lives in ./animation-engine/.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

export {
  SpringPhysics,
  HapticFeedback,
  AnimationEngine,
  GestureHandler,
  ANIMATION_PRESETS,
} from './animation-engine';

export type {
  AnimationConfig,
  SpringConfig,
  GestureConfig,
  SequenceStep,
} from './animation-engine';

export { default } from './animation-engine';
