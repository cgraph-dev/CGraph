/**
 * Animation Presets Library
 *
 * Barrel file re-exporting all animation presets submodules.
 */

export { springs, tweens, durationsSec, loop, loopWithDelay, staggerConfigs, entranceVariants } from './presets';
export { chatBubbleAnimations } from './chat-bubbles';
export type { ChatBubbleStyleId } from './chat-bubbles';
export {
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
} from './effects';
export { transitions, rnTransitions } from '@cgraph/animation-constants';

// Default export
export { springs as default } from './presets';
