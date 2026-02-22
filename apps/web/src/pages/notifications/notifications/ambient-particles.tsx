/**
 * Ambient Particles
 *
 * Decorative floating particles for the notifications page background.
 */

import { motion } from 'framer-motion';

interface AmbientParticlesProps {
  count?: number;
}

export function AmbientParticles({ count = 8 }: AmbientParticlesProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}
