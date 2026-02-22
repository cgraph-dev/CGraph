/**
 * BackgroundEffectRenderer
 *
 * Renders ambient particle effects as a fixed overlay based on the user's
 * selected particleEffect from the customization store.
 *
 * Supports: snow, stars, fireflies, sparkles, confetti, bubbles, rain, leaves
 * Respects reduced motion preferences.
 *
 * @module settings/components/BackgroundEffectRenderer
 */

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCustomizationStore } from '@/modules/settings/store/customization';

// ============================================================================
// TYPES
// ============================================================================

interface ParticleConfig {
  emoji?: string;
  colors: string[];
  count: number;
  sizeRange: [number, number];
  durationRange: [number, number];
  drift: { x: number; y: number };
  opacity: [number, number];
}

interface GeneratedParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
  emoji?: string;
}

// ============================================================================
// PARTICLE CONFIGURATIONS
// ============================================================================

const PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  snow: {
    emoji: '❄',
    colors: ['#ffffff', '#e0e7ff', '#c7d2fe'],
    count: 40,
    sizeRange: [8, 16],
    durationRange: [6, 14],
    drift: { x: 30, y: 100 },
    opacity: [0.3, 0.8],
  },
  stars: {
    emoji: '✦',
    colors: ['#fbbf24', '#f9fafb', '#a78bfa'],
    count: 30,
    sizeRange: [6, 14],
    durationRange: [3, 8],
    drift: { x: 10, y: 10 },
    opacity: [0.2, 0.9],
  },
  fireflies: {
    colors: ['#84cc16', '#a3e635', '#d9f99d'],
    count: 20,
    sizeRange: [3, 6],
    durationRange: [4, 10],
    drift: { x: 40, y: 40 },
    opacity: [0.3, 1],
  },
  sparkles: {
    emoji: '✨',
    colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
    count: 25,
    sizeRange: [8, 16],
    durationRange: [2, 5],
    drift: { x: 20, y: 20 },
    opacity: [0.4, 1],
  },
  confetti: {
    colors: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'],
    count: 35,
    sizeRange: [4, 8],
    durationRange: [5, 12],
    drift: { x: 50, y: 100 },
    opacity: [0.5, 0.9],
  },
  bubbles: {
    colors: ['rgba(99,102,241,0.4)', 'rgba(139,92,246,0.3)', 'rgba(6,182,212,0.3)'],
    count: 20,
    sizeRange: [6, 20],
    durationRange: [6, 14],
    drift: { x: 20, y: -80 },
    opacity: [0.2, 0.5],
  },
  rain: {
    colors: ['rgba(147,197,253,0.6)', 'rgba(191,219,254,0.4)'],
    count: 50,
    sizeRange: [1, 2],
    durationRange: [0.5, 1.5],
    drift: { x: 10, y: 100 },
    opacity: [0.3, 0.6],
  },
  leaves: {
    emoji: '🍃',
    colors: ['#22c55e', '#16a34a', '#86efac'],
    count: 15,
    sizeRange: [12, 20],
    durationRange: [8, 16],
    drift: { x: 60, y: 100 },
    opacity: [0.4, 0.8],
  },
};

// ============================================================================
// PARTICLE GENERATION
// ============================================================================

function generateParticles(config: ParticleConfig): GeneratedParticle[] {
  return Array.from({ length: config.count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
    opacity: config.opacity[0] + Math.random() * (config.opacity[1] - config.opacity[0]),
    duration:
      config.durationRange[0] + Math.random() * (config.durationRange[1] - config.durationRange[0]),
    delay: Math.random() * 5,
    color: config.colors[i % config.colors.length]!,
    emoji: config.emoji,
  }));
}

// ============================================================================
// SINGLE PARTICLE
// ============================================================================

const ParticleElement = memo(function ParticleElement({
  particle,
  drift,
  isRain,
}: {
  particle: GeneratedParticle;
  drift: { x: number; y: number };
  isRain: boolean;
}) {
  if (particle.emoji) {
    return (
      <motion.span
        className="pointer-events-none absolute select-none"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          fontSize: particle.size,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, particle.opacity, particle.opacity * 0.5, 0],
          x: [0, drift.x * (Math.random() - 0.5), drift.x * (Math.random() - 0.3)],
          y: [0, drift.y * 0.5, drift.y],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: particle.duration,
          delay: particle.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {particle.emoji}
      </motion.span>
    );
  }

  // Rain uses thin vertical lines
  if (isRain) {
    return (
      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: `${particle.x}%`,
          top: '-5%',
          width: particle.size,
          height: particle.size * 20,
          background: particle.color,
          borderRadius: '1px',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, particle.opacity, 0],
          y: [0, window.innerHeight + 100],
          x: [0, drift.x * (Math.random() - 0.5)],
        }}
        transition={{
          duration: particle.duration,
          delay: particle.delay,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    );
  }

  // Default circular particle (fireflies, bubbles, confetti)
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: particle.size,
        height: particle.size,
        background: particle.color,
        boxShadow: `0 0 ${particle.size}px ${particle.color}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, particle.opacity, particle.opacity * 0.3, 0],
        scale: [0.5, 1, 1.2, 0.8],
        x: [0, drift.x * (Math.random() - 0.5), drift.x * (Math.random() - 0.3)],
        y: [0, drift.y * 0.5, drift.y],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BackgroundEffectRenderer = memo(function BackgroundEffectRenderer() {
  const particleEffect = useCustomizationStore((s) => s.particleEffect);
  const particleEffectsEnabled = useCustomizationStore((s) => s.particleEffects);
  const prefersReducedMotion = useReducedMotion();

  const config = particleEffect ? PARTICLE_CONFIGS[particleEffect] : null;

  const particles = useMemo(() => {
    if (!config) return [];
    // Reduce count for performance
    const adjustedCount = prefersReducedMotion ? Math.floor(config.count / 3) : config.count;
    return generateParticles({ ...config, count: adjustedCount });
  }, [config, prefersReducedMotion]);

  // Don't render if no effect selected, effects disabled, or reduced motion
  if (!particleEffect || particleEffect === 'none' || !config) return null;
  if (!particleEffectsEnabled) return null;
  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <ParticleElement
          key={particle.id}
          particle={particle}
          drift={config.drift}
          isRain={particleEffect === 'rain'}
        />
      ))}
    </div>
  );
});
