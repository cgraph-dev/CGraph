/**
 * "G" Letter Circuit Traces
 *
 * Twelve motion paths that draw the "G" character in circuit-board
 * style, including cross-connector traces between C and G.
 *
 * @module components/animated-logo/svg/GLetterTraces
 */

import { motion } from 'motion/react';
import { TRACE_DRAW_VARIANTS } from '../constants';
import type { SvgFilterIds } from '../types';

/** Props for GLetterTraces */
export interface GLetterTracesProps {
  /** Unique SVG filter/gradient IDs */
  ids: SvgFilterIds;
  /** Whether animations should play */
  shouldAnimate: boolean;
}

/** Circuit-board traces forming the "G" letter */
export function GLetterTraces({ ids, shouldAnimate }: GLetterTracesProps) {
  return (
    <g filter={`url(#${ids.glow})`}>
      {/* Top horizontal */}
      <motion.path
        d="M72 20H102"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.1}
      />
      {/* Top-left diagonal */}
      <motion.path
        d="M72 20V26L66 32"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.15}
      />
      {/* Right vertical upper */}
      <motion.path
        d="M102 20V44"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.2}
      />
      {/* Mid horizontal with branch */}
      <motion.path
        d="M102 48H84L78 42"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.35}
      />
      {/* Mid branch lower */}
      <motion.path
        d="M84 48L78 54"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.4}
      />
      {/* Right vertical lower */}
      <motion.path
        d="M102 52V76"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.45}
      />
      {/* Bottom horizontal */}
      <motion.path
        d="M72 76H102"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
        custom={0.5}
      />
      {/* Bottom-left diagonal */}
      <motion.path
        d="M72 76V70L66 64"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="2.5"
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
        d="M96 28H88L82 34"
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
        d="M96 68H88L82 62"
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
      {/* Cross-connector upper (C→G bridge) */}
      <motion.path
        d="M54 38H60L66 32"
        stroke={`url(#${ids.tertiaryGrad})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.6"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.6 }}
        custom={0.7}
      />
      {/* Cross-connector lower (C→G bridge) */}
      <motion.path
        d="M54 58H60L66 64"
        stroke={`url(#${ids.tertiaryGrad})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.6"
        fill="none"
        variants={TRACE_DRAW_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.6 }}
        custom={0.75}
      />
    </g>
  );
}
