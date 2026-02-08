/**
 * Animation Presets Library
 *
 * Thin re-export barrel. All implementation lives in ./animation-presets/.
 */

export {
  springs,
  tweens,
  staggerConfigs,
  entranceVariants,
  chatBubbleAnimations,
  hoverAnimations,
  createPulseAnimation,
  createFireAnimation,
  createElectricAnimation,
  particleAnimations,
  backgroundAnimations,
  getStaggerDelay,
  createRepeatTransition,
  createSpring,
  getRarityGlow,
  getTierGlow,
} from './animation-presets';

export type { ChatBubbleStyleId } from './animation-presets';

export { default } from './animation-presets';
