export type {
  BorderParticleSystemProps,
  Particle,
  DOMParticleProps,
  ParticlePreset,
  ParticleColors,
} from './types';

export { PARTICLE_PRESETS } from './presets';
export { random, lerp, getColorVariant } from './utils';
export { DOMParticle } from './DOMParticle';
export { getAnimationForType } from './animations';
export { BorderParticleSystem } from './BorderParticleSystem';
export {
  FlameParticles,
  SparkParticles,
  SnowflakeParticles,
  SakuraParticles,
  ElectricParticles,
} from './PresetWrappers';

export { BorderParticleSystem as default } from './BorderParticleSystem';
