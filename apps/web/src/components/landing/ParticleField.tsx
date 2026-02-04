/**
 * ParticleField Component - Ambient floating particles background
 *
 * Features:
 * - Floating particles with random motion
 * - Emerald, purple, and cyan color variants
 * - Performance optimized with CSS animations
 * - Respects reduced motion preferences
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ParticleFieldProps {
  /** Number of particles */
  count?: number;
  /** Particle colors to use */
  colors?: readonly ('emerald' | 'purple' | 'cyan')[];
  /** Additional CSS classes */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: 'emerald' | 'purple' | 'cyan';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_MAP = {
  emerald: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  purple: { bg: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)' },
  cyan: { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },
} as const;

/** Default particle colors - stable reference to prevent unnecessary re-renders */
const DEFAULT_COLORS: readonly ('emerald' | 'purple' | 'cyan')[] = ['emerald', 'purple', 'cyan'];

// ============================================================================
// PARTICLE GENERATION
// ============================================================================

function generateParticles(
  count: number,
  colors: readonly ('emerald' | 'purple' | 'cyan')[]
): Particle[] {
  // Ensure we have at least one color
  const safeColors = colors.length > 0 ? colors : ['emerald' as const];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.5,
    duration: 8 + Math.random() * 8,
    delay: Math.random() * 5,
    color: safeColors[i % safeColors.length]!,
  }));
}

// ============================================================================
// PARTICLE COMPONENT
// ============================================================================

const ParticleElement = memo(function ParticleElement({
  particle,
  prefersReducedMotion,
}: {
  particle: Particle;
  prefersReducedMotion: boolean;
}) {
  const { bg, glow } = COLOR_MAP[particle.color];

  // Static rendering for reduced motion
  if (prefersReducedMotion) {
    return (
      <div
        className="absolute rounded-full"
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: particle.size,
          height: particle.size,
          background: bg,
          boxShadow: `0 0 ${particle.size * 2}px ${glow}`,
          opacity: particle.opacity * 0.5,
        }}
      />
    );
  }

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: particle.size,
        height: particle.size,
        background: bg,
        boxShadow: `0 0 ${particle.size * 2}px ${glow}`,
      }}
      initial={{
        opacity: 0,
        scale: 0,
      }}
      animate={{
        opacity: [0, particle.opacity, particle.opacity * 0.3, particle.opacity, 0],
        scale: [0.5, 1, 1.2, 0.9, 1],
        x: [0, 20, -10, 15, 0],
        y: [0, -30, -15, -25, 0],
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

export const ParticleField = memo(function ParticleField({
  count = 50,
  colors = DEFAULT_COLORS,
  className,
}: ParticleFieldProps) {
  const prefersReducedMotion = useReducedMotion();

  const particles = useMemo(() => generateParticles(count, colors), [count, colors]);

  return (
    <div className={cn('particle-field', className)} aria-hidden="true">
      {particles.map((particle) => (
        <ParticleElement
          key={particle.id}
          particle={particle}
          prefersReducedMotion={prefersReducedMotion ?? false}
        />
      ))}
    </div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { ParticleFieldProps };
