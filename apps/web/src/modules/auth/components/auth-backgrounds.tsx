/**
 * Authentication page background variants.
 * @module
 */
import React from 'react';
import { motion } from 'motion/react';
import { loop } from '@/lib/animation-presets';

/**
 * unknown for the auth module.
 */
/**
 * Grid Background component.
 * @returns The rendered JSX element.
 */
export function GridBackground(): React.ReactElement | null {
  return (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  </div>
);
}

/**
 * unknown for the auth module.
 */
/**
 * Gradient Background component.
 * @returns The rendered JSX element.
 */
export function GradientBackground(): React.ReactElement | null {
  return (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <motion.div
      animate={{
        background: [
          'radial-gradient(circle at 20% 80%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
          'radial-gradient(circle at 80% 20%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
          'radial-gradient(circle at 20% 80%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
        ],
      }}
      transition={loop({ duration: 10, ease: 'linear' })}
      className="absolute inset-0"
    />
  </div>
);
}

/**
 * unknown for the auth module.
 */
/**
 * Particles Background component.
 * @returns The rendered JSX element.
 */
export function ParticlesBackground(): React.ReactElement | null {
  return (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{
          x: Math.random() * 100 + '%',
          y: Math.random() * 100 + '%',
          opacity: Math.random() * 0.5 + 0.2,
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          y: [null, Math.random() * 100 + '%'],
          x: [null, Math.random() * 100 + '%'],
        }}
        transition={{
          repeat: Infinity,
          duration: Math.random() * 20 + 10,
          ease: 'linear',
        }}
        className="absolute h-1 w-1 rounded-full bg-primary-500/30"
      />
    ))}
  </div>
);
}

export type BackgroundEffect = 'gradient' | 'particles' | 'grid' | 'none';

/**
 * unknown for the auth module.
 */
/**
 * Auth Background component.
 * @returns The rendered JSX element.
 */
export function AuthBackground({ effect }: { effect: BackgroundEffect }): React.ReactElement | null {
  switch (effect) {
    case 'gradient':
      return <GradientBackground />;
    case 'particles':
      return <ParticlesBackground />;
    case 'grid':
      return <GridBackground />;
    default:
      return null;
  }
};
