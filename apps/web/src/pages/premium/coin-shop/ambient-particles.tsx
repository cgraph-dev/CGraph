/**
 * AmbientParticles component - decorative floating particles
 */

import { motion } from 'motion/react';

const PARTICLE_COUNT = 15;

/**
 * unknown for the premium module.
 */
/**
 * Ambient Particles component.
 */
export function AmbientParticles() {
  return (
    <>
      {[...Array(PARTICLE_COUNT)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed h-1 w-1 rounded-full bg-yellow-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}
    </>
  );
}
