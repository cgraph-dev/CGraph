/**
 * Particle data generators for ParticlePreview component
 *
 * Extracted factory functions that produce particle position/timing data
 * for each particle effect type.
 *
 * @module pages/customize/effects-customization
 */

import type {
  SnowParticle,
  StarsParticle,
  BubblesParticle,
  SparklesParticle,
  ConfettiParticle,
  FirefliesParticle,
} from './types';

/** Confetti palette used across confetti particles */
const CONFETTI_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899'] as const;

export function generateSnowParticles(): SnowParticle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    startX: Math.random() * 100,
    endX: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));
}

export function generateStarsParticles(): StarsParticle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random(),
  }));
}

export function generateBubblesParticles(): BubblesParticle[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: 20 + Math.random() * 20,
    left: Math.random() * 80,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 2,
  }));
}

export function generateSparklesParticles(): SparklesParticle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    fontSize: 8 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 1 + Math.random(),
  }));
}

export function generateConfettiParticles(): ConfettiParticle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));
}

export function generateFirefliesParticles(): FirefliesParticle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));
}

/** GPU layer promotion styles for better animation performance */
export function getGpuStyles(shouldAnimate: boolean) {
  return {
    willChange: shouldAnimate ? ('transform, opacity' as const) : ('auto' as const),
    transform: 'translateZ(0)' as const,
  };
}
