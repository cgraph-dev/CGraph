/**
 * Circuit Nodes
 *
 * Twenty animated circles representing data nodes on the
 * C and G letter circuit traces — 10 for each letter.
 *
 * @module components/animated-logo/svg/CircuitNodes
 */

import { motion } from 'framer-motion';
import { NODE_APPEAR_VARIANTS, PULSE_VARIANTS } from '../constants';
import type { SvgFilterIds } from '../types';

/** Props for CircuitNodes */
export interface CircuitNodesProps {
  /** Unique SVG filter/gradient IDs */
  ids: SvgFilterIds;
  /** Whether animations should play */
  shouldAnimate: boolean;
  /** Whether continuous loading pulse is active */
  isLoading: boolean;
}

/** All 20 circuit node circles for C and G letters */
export function CircuitNodes({ ids, shouldAnimate, isLoading }: CircuitNodesProps) {
  return (
    <g filter={`url(#${ids.nodeGlow})`}>
      {/* ── C letter nodes ──────────────────────────────────────────── */}
      <motion.circle
        cx="18"
        cy="20"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.8}
      />
      <motion.circle
        cx="42"
        cy="20"
        r="2.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.85}
      />
      <motion.circle
        cx="48"
        cy="32"
        r="2"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.9}
      />
      {/* Center-left node (pulses during loading) */}
      <motion.circle
        cx="18"
        cy="48"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={isLoading ? PULSE_VARIANTS : NODE_APPEAR_VARIANTS}
        initial={isLoading ? undefined : 'hidden'}
        animate={isLoading ? 'pulse' : shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.95}
      />
      <motion.circle
        cx="18"
        cy="76"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.0}
      />
      <motion.circle
        cx="42"
        cy="76"
        r="2.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.05}
      />
      <motion.circle
        cx="48"
        cy="64"
        r="2"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.1}
      />
      {/* C secondary nodes */}
      <motion.circle
        cx="36"
        cy="42"
        r="2"
        fill={`url(#${ids.secondaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.15}
      />
      <motion.circle
        cx="36"
        cy="54"
        r="2"
        fill={`url(#${ids.secondaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.2}
      />
      <motion.circle
        cx="30"
        cy="48"
        r="1.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.25}
      />

      {/* ── G letter nodes ──────────────────────────────────────────── */}
      <motion.circle
        cx="72"
        cy="20"
        r="2.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.9}
      />
      <motion.circle
        cx="102"
        cy="20"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={0.95}
      />
      <motion.circle
        cx="66"
        cy="32"
        r="2"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.0}
      />
      {/* Center-right node (pulses during loading) */}
      <motion.circle
        cx="102"
        cy="48"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={isLoading ? PULSE_VARIANTS : NODE_APPEAR_VARIANTS}
        initial={isLoading ? undefined : 'hidden'}
        animate={isLoading ? 'pulse' : shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.05}
      />
      <motion.circle
        cx="72"
        cy="76"
        r="2.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.1}
      />
      <motion.circle
        cx="102"
        cy="76"
        r="3"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.15}
      />
      <motion.circle
        cx="66"
        cy="64"
        r="2"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.2}
      />
      {/* G secondary nodes */}
      <motion.circle
        cx="78"
        cy="42"
        r="2"
        fill={`url(#${ids.secondaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.25}
      />
      <motion.circle
        cx="78"
        cy="54"
        r="2"
        fill={`url(#${ids.secondaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.3}
      />
      <motion.circle
        cx="84"
        cy="48"
        r="1.5"
        fill={`url(#${ids.primaryGrad})`}
        variants={NODE_APPEAR_VARIANTS}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
        custom={1.35}
      />
    </g>
  );
}
