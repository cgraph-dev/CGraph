/**
 * Data Flow Particles
 *
 * Five animated circles representing data packets flowing
 * through the circuit traces between C and G letters.
 *
 * @module components/animated-logo/svg/DataFlowParticles
 */

import { durations } from '@cgraph/animation-constants';
import { motion, AnimatePresence } from 'motion/react';
import type { SvgFilterIds, ColorDefinition } from '../types';
import { tweens, loopWithDelay } from '@/lib/animation-presets';

/** Props for DataFlowParticles */
export interface DataFlowParticlesProps {
  /** Unique SVG filter/gradient IDs */
  ids: SvgFilterIds;
  /** Color palette */
  colors: ColorDefinition;
  /** Whether particles should be visible */
  showParticles: boolean;
}

/** Animated data-flow particles along circuit traces */
export function DataFlowParticles({ ids, colors: c, showParticles }: DataFlowParticlesProps) {
  return (
    <AnimatePresence>
      {showParticles && (
        <g filter={`url(#${ids.particleGlow})`}>
          {/* Left vertical flow (C letter) */}
          <motion.circle
            r="2.5"
            fill={c.primary}
            initial={{ cx: 18, cy: 20, opacity: 0 }}
            animate={{ cx: [18, 18, 18], cy: [20, 48, 76], opacity: [1, 1, 0] }}
            transition={loopWithDelay(tweens.verySlow, 0.5)}
          />
          {/* Right vertical flow (G letter) */}
          <motion.circle
            r="2.5"
            fill={c.primary}
            initial={{ cx: 102, cy: 20, opacity: 0 }}
            animate={{ cx: [102, 102, 102], cy: [20, 48, 76], opacity: [1, 1, 0] }}
            transition={{
              duration: durations.ambient.ms / 1000,
              delay: 0.3,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: 'linear',
            }}
          />
          {/* Horizontal cross-flow (C→G through center) */}
          <motion.circle
            r="3"
            fill={c.tertiary}
            initial={{ cx: 30, cy: 48, opacity: 0 }}
            animate={{
              cx: [30, 45, 60, 75, 90],
              cy: [48, 48, 48, 48, 48],
              opacity: [0, 1, 1, 1, 0],
              scale: [0.5, 1, 1.2, 1, 0.5],
            }}
            transition={{
              duration: durations.loop.ms / 1000,
              delay: 0.8,
              repeat: Infinity,
              repeatDelay: 0.3,
              ease: 'easeInOut',
            }}
          />
          {/* Secondary left particle */}
          <motion.circle
            r="1.5"
            fill={c.secondary}
            initial={{ cx: 24, cy: 28, opacity: 0 }}
            animate={{ cx: [24, 30, 38], cy: [28, 30, 34], opacity: [0, 1, 0] }}
            transition={{
              duration: durations.verySlow.ms / 1000,
              delay: 1.2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear',
            }}
          />
          {/* Secondary right particle */}
          <motion.circle
            r="1.5"
            fill={c.secondary}
            initial={{ cx: 96, cy: 28, opacity: 0 }}
            animate={{ cx: [96, 90, 82], cy: [28, 30, 34], opacity: [0, 1, 0] }}
            transition={{
              duration: durations.verySlow.ms / 1000,
              delay: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear',
            }}
          />
        </g>
      )}
    </AnimatePresence>
  );
}
