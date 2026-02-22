/**
 * Central Hub
 *
 * The pulsing central connection point between C and G letters,
 * featuring a glowing ring during loading/particle phases.
 *
 * @module components/animated-logo/svg/CentralHub
 */

import { motion } from 'framer-motion';
import { NODE_APPEAR_VARIANTS } from '../constants';
import type { SvgFilterIds } from '../types';

/** Props for CentralHub */
export interface CentralHubProps {
  /** Unique SVG filter/gradient IDs */
  ids: SvgFilterIds;
  /** Whether animations should play */
  shouldAnimate: boolean;
  /** Whether continuous loading is active */
  isLoading: boolean;
  /** Whether particles are visible (enables pulse ring) */
  showParticles: boolean;
  /** Tertiary color for the pulse ring */
  tertiaryColor: string;
}

/** Central hub circles and pulse ring */
export function CentralHub({
  ids,
  shouldAnimate,
  isLoading,
  showParticles,
  tertiaryColor,
}: CentralHubProps) {
  return (
    <g filter={`url(#${ids.nodeGlow})`}>
      {/* Outer hub circle */}
      <motion.circle
        cx="60"
        cy="48"
        r="6"
        fill={`url(#${ids.tertiaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.5}
      />
      {/* Inner bright core */}
      <motion.circle
        cx="60"
        cy="48"
        r="3"
        fill="#fff"
        fillOpacity="0.5"
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 0.5 }}
        custom={1.55}
      />
      {/* Expanding pulse ring (visible during loading/particles) */}
      {(isLoading || showParticles) && (
        <motion.circle
          cx="60"
          cy="48"
          r="8"
          fill="none"
          stroke={tertiaryColor}
          strokeWidth="1.5"
          initial={{ r: 8, opacity: 0.8 }}
          animate={{ r: [8, 16, 8], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </g>
  );
}
