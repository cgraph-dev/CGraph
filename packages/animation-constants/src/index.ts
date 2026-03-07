/**
 * @cgraph/animation-constants
 *
 * Platform-agnostic animation constants consumed by both
 * apps/web (Framer Motion) and apps/mobile (Reanimated).
 *
 * Only raw numeric / string values live here — no framework imports.
 */

export { springs, type SpringConfig } from './springs';
export { durations, type DurationPreset } from './durations';
export { easings, cubicBeziers, type CubicBezier } from './easings';
export { stagger, type StaggerConfig } from './stagger';
export { transitions, rnTransitions } from './transitions';
export { LAYOUT_IDS } from './layout-ids';
export {
  backgroundPresets,
  type BackgroundPresets,
  type ParticleFieldPreset,
  type CyberGridPreset,
  type AuroraGlowPreset,
  type BackgroundColors,
} from './backgrounds';
export {
  buttonPresets,
  type ButtonPresets,
  type MagneticPreset,
  type ShimmerPreset,
  type GlowPreset,
  type GlowState,
  type FlowingBorderPreset,
  type TapPreset,
  type HoverPreset,
  type ButtonReducedMotion,
} from './buttons';
