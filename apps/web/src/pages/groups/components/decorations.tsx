/**
 * LoadingOverlay and AmbientParticles components
 * @module pages/groups
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'motion/react';

/**
 * unknown for the groups module.
 */
/**
 * Loading Overlay — loading placeholder.
 */
export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading servers...</span>
      </div>
    </div>
  );
}

/**
 * unknown for the groups module.
 */
/**
 * Ambient Particles component.
 */
export function AmbientParticles() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute z-0 h-0.5 w-0.5 rounded-full bg-primary-400"
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
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}
