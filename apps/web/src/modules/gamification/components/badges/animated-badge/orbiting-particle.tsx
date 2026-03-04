/**
 * OrbitingParticle component - particle effect for epic+ badges
 */

import { motion } from 'motion/react';
import type { ParticleProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Orbiting Particle component.
 */
export function OrbitingParticle({
  index,
  total,
  radius,
  color,
  reverse = false,
  delay = 0,
}: ParticleProps) {
  const angle = (index / total) * 360;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4,
        height: 4,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}`,
        top: '50%',
        left: '50%',
        marginTop: -2,
        marginLeft: -2,
        transformOrigin: `2px ${radius}px`,
      }}
      initial={{ rotate: angle }}
      animate={{
        rotate: reverse ? [angle, angle - 360] : [angle, angle + 360],
      }}
      transition={{
        duration: reverse ? 5 : 3,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    />
  );
}
