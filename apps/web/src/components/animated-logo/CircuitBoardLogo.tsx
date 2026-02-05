/**
 * CircuitBoardLogo - SVG circuit board visualization
 * Extracted from AnimatedLogo.tsx
 *
 * Features:
 * - Sequential trace drawing (electricity flowing through circuits)
 * - Pulsing node effects (data nodes activating)
 * - Data packet flow animation (particles moving along traces)
 * - Central hub pulsing (the Graph connection point)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useId } from 'react';
import type { CircuitBoardLogoProps, SvgFilterIds } from './types';
import {
  COLOR_PALETTES,
  TRACE_DRAW_VARIANTS,
  NODE_APPEAR_VARIANTS,
  PULSE_VARIANTS,
  SPLASH_TIMINGS,
} from './constants';

export function CircuitBoardLogo({
  logoSize,
  isAnimated = false,
  isLoading = false,
  isSplash = false,
  color = 'default',
  onAnimationComplete,
}: CircuitBoardLogoProps) {
  const uniqueId = useId();
  const c = COLOR_PALETTES[color];
  const [showParticles, setShowParticles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Progress through animation phases for splash
  useEffect(() => {
    if (isSplash) {
      const timers = [
        setTimeout(() => setAnimationPhase(1), SPLASH_TIMINGS.tracesDrawn),
        setTimeout(() => setAnimationPhase(2), SPLASH_TIMINGS.nodesAppear),
        setTimeout(() => setAnimationPhase(3), SPLASH_TIMINGS.particlesStart),
        setTimeout(() => {
          setAnimationPhase(4);
          onAnimationComplete?.();
        }, SPLASH_TIMINGS.complete),
      ];
      return () => timers.forEach(clearTimeout);
    }
    if (isLoading) {
      setShowParticles(true);
    }
    return undefined;
  }, [isSplash, isLoading, onAnimationComplete]);

  useEffect(() => {
    if (animationPhase >= 3) {
      setShowParticles(true);
    }
  }, [animationPhase]);

  const ids: SvgFilterIds = {
    primaryGrad: `anim-circuit-primary-${uniqueId}`,
    secondaryGrad: `anim-circuit-secondary-${uniqueId}`,
    tertiaryGrad: `anim-circuit-tertiary-${uniqueId}`,
    glow: `anim-glow-${uniqueId}`,
    nodeGlow: `anim-node-glow-${uniqueId}`,
    particleGlow: `anim-particle-glow-${uniqueId}`,
  };

  const shouldAnimate = isAnimated || isSplash || isLoading;

  return (
    <svg
      viewBox="0 0 120 96"
      width={logoSize}
      height={logoSize * 0.8}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id={ids.primaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.primary} stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={ids.secondaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.secondary} />
          <stop offset="100%" stopColor={c.secondary} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={ids.tertiaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.tertiary} />
          <stop offset="100%" stopColor={c.tertiary} stopOpacity="0.8" />
        </linearGradient>

        {/* Glow filters */}
        <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={ids.nodeGlow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={ids.particleGlow} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background hexagon frame */}
      <motion.path
        d="M60 2L112 28V68L60 94L8 68V28L60 2Z"
        fill="none"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 0.2 } : { pathLength: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* "C" LETTER TRACES */}
      <g filter={`url(#${ids.glow})`}>
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

      {/* "G" LETTER TRACES */}
      <g filter={`url(#${ids.glow})`}>
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

      {/* CIRCUIT NODES */}
      <g filter={`url(#${ids.nodeGlow})`}>
        {/* C nodes */}
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
        {/* G nodes */}
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

      {/* CENTRAL HUB */}
      <g filter={`url(#${ids.nodeGlow})`}>
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
        {(isLoading || showParticles) && (
          <motion.circle
            cx="60"
            cy="48"
            r="8"
            fill="none"
            stroke={c.tertiary}
            strokeWidth="1.5"
            initial={{ r: 8, opacity: 0.8 }}
            animate={{ r: [8, 16, 8], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </g>

      {/* DATA FLOW PARTICLES */}
      <AnimatePresence>
        {showParticles && (
          <g filter={`url(#${ids.particleGlow})`}>
            <motion.circle
              r="2.5"
              fill={c.primary}
              initial={{ cx: 18, cy: 20, opacity: 0 }}
              animate={{ cx: [18, 18, 18], cy: [20, 48, 76], opacity: [1, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
            />
            <motion.circle
              r="2.5"
              fill={c.primary}
              initial={{ cx: 102, cy: 20, opacity: 0 }}
              animate={{ cx: [102, 102, 102], cy: [20, 48, 76], opacity: [1, 1, 0] }}
              transition={{
                duration: 1.5,
                delay: 0.3,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'linear',
              }}
            />
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
                duration: 2,
                delay: 0.8,
                repeat: Infinity,
                repeatDelay: 0.3,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              r="1.5"
              fill={c.secondary}
              initial={{ cx: 24, cy: 28, opacity: 0 }}
              animate={{ cx: [24, 30, 38], cy: [28, 30, 34], opacity: [0, 1, 0] }}
              transition={{
                duration: 1,
                delay: 1.2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />
            <motion.circle
              r="1.5"
              fill={c.secondary}
              initial={{ cx: 96, cy: 28, opacity: 0 }}
              animate={{ cx: [96, 90, 82], cy: [28, 30, 34], opacity: [0, 1, 0] }}
              transition={{
                duration: 1,
                delay: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />
          </g>
        )}
      </AnimatePresence>
    </svg>
  );
}
