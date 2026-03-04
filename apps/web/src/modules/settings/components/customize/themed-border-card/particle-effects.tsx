/**
 * ParticleEffects Component
 *
 * Animated particles for special border types
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'motion/react';

interface ParticleEffectsProps {
  colors: string[];
}

/**
 * unknown for the settings module.
 */
/**
 * Particle Effects component.
 */
export function ParticleEffects({ colors }: ParticleEffectsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 50}%`,
            top: `${50 + Math.sin((i * Math.PI * 2) / 6) * 50}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: durations.ambient.ms / 1000,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
