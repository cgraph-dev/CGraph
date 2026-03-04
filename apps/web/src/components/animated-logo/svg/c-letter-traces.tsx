/**
 * "C" Letter Circuit Traces
 *
 * Nine motion paths that draw the "C" character
 * in circuit-board style with primary and secondary gradients.
 *
 * @module components/animated-logo/svg/CLetterTraces
 */

import { motion } from 'motion/react';
import { TRACE_DRAW_VARIANTS } from '../constants';
import type { SvgFilterIds } from '../types';

/** Props for CLetterTraces */
export interface CLetterTracesProps {
  /** Unique SVG filter/gradient IDs */
  ids: SvgFilterIds;
  /** Whether animations should play */
  shouldAnimate: boolean;
}

/** Circuit-board traces forming the "C" letter */
export function CLetterTraces({ ids, shouldAnimate }: CLetterTracesProps) {
  return (
    <g filter={`url(#${ids.glow})`}>
      {/* Main vertical stroke */}
      <motion.path
        d="M18 20V48V76"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0}
      />
      {/* Top horizontal */}
      <motion.path
        d="M18 20H42"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.1}
      />
      {/* Top diagonal connector */}
      <motion.path
        d="M42 20V26L48 32"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.2}
      />
      {/* Bottom horizontal */}
      <motion.path
        d="M18 76H42"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.3}
      />
      {/* Bottom diagonal connector */}
      <motion.path
        d="M42 76V70L48 64"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.4}
      />
      {/* Mid branch upper */}
      <motion.path
        d="M18 48H30L36 42"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.5}
      />
      {/* Mid branch lower */}
      <motion.path
        d="M30 48L36 54"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.55}
      />
      {/* Secondary upper trace */}
      <motion.path
        d="M24 28H32L38 34"
        stroke={`url(#${ids.secondaryGrad})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.7 }}
        custom={0.6}
      />
      {/* Secondary lower trace */}
      <motion.path
        d="M24 68H32L38 62"
        stroke={`url(#${ids.secondaryGrad})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.7 }}
        custom={0.65}
      />
    </g>
  );
}
