import { memo } from 'react';
import type { ParticleConfig } from '@/types/avatar-borders';
import type { BorderParticleSystemProps } from './types';
import { PARTICLE_PRESETS } from './presets';
import { BorderParticleSystem } from './BorderParticleSystem';

// Default config values for preset wrappers
const createPresetConfig = (
  type: keyof typeof PARTICLE_PRESETS,
  count: number
): ParticleConfig => ({
  type,
  count,
  size: PARTICLE_PRESETS[type]?.maxSize || 8,
  color: '#ffffff',
  opacity: 1,
  speed: 1,
  direction: 'random',
  pattern: 'orbit',
});

export const FlameParticles = memo(function FlameParticles(
  props: Omit<BorderParticleSystemProps, 'config'>
) {
  return <BorderParticleSystem {...props} config={createPresetConfig('flame', 12)} />;
});

export const SparkParticles = memo(function SparkParticles(
  props: Omit<BorderParticleSystemProps, 'config'>
) {
  return <BorderParticleSystem {...props} config={createPresetConfig('spark', 16)} />;
});

export const SnowflakeParticles = memo(function SnowflakeParticles(
  props: Omit<BorderParticleSystemProps, 'config'>
) {
  return <BorderParticleSystem {...props} config={createPresetConfig('snowflake', 20)} />;
});

export const SakuraParticles = memo(function SakuraParticles(
  props: Omit<BorderParticleSystemProps, 'config'>
) {
  return <BorderParticleSystem {...props} config={createPresetConfig('sakura', 15)} />;
});

export const ElectricParticles = memo(function ElectricParticles(
  props: Omit<BorderParticleSystemProps, 'config'>
) {
  return <BorderParticleSystem {...props} config={createPresetConfig('electric', 8)} />;
});
