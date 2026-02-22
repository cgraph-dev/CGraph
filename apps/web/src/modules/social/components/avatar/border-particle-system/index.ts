export type {
  BorderParticleSystemProps,
  Particle,
  DOMParticleProps,
  ParticlePreset,
  ParticleColors,
} from './types';

export { PARTICLE_PRESETS } from './presets';
export { random, lerp, getColorVariant } from './utils';
export { DOMParticle } from './dom-particle';
export { getAnimationForType } from './animations';
export { BorderParticleSystem } from './border-particle-system';
export {
  FlameParticles,
  SparkParticles,
  SnowflakeParticles,
  SakuraParticles,
  ElectricParticles,
} from './preset-wrappers';

export { BorderParticleSystem as default } from './border-particle-system';
