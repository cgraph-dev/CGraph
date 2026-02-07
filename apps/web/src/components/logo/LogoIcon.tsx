/**
 * CGraph Circuit Board Logo Icon
 *
 * Primary PCB-styled "CG" monogram with:
 * - Double-outline strokes (circuit board traces)
 * - Angular/octagonal letter shapes with cut corners
 * - Small circular connection nodes
 * - Cyan glowing highlights at key points
 * - Overlapping C and G in the center
 * - Optional entrance animation via Framer Motion
 *
 * @module components/logo/LogoIcon
 */

import { motion, type Variants } from 'framer-motion';
import { useMemo, useId } from 'react';
import { colorPalettes } from './colors';
import type { LogoProps } from './types';

/**
 * Main CG Circuit Board Logo.
 *
 * Renders an SVG with double-outline PCB-style letter paths,
 * connection nodes, and optional glow filters. When `animated`
 * is true, traces draw in and nodes spring into view.
 */
export function LogoIcon({
  size = 40,
  className = '',
  animated = false,
  color = 'default',
  showGlow = true,
}: LogoProps) {
  const uniqueId = useId();
  const c = colorPalettes[color];

  const ids = useMemo(
    () => ({
      glow: `logo-glow-${uniqueId}`,
      nodeGlow: `logo-node-glow-${uniqueId}`,
    }),
    [uniqueId]
  );

  // Animation variants for trace drawing
  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.8, delay: delay * 0.1, ease: 'easeInOut' },
        opacity: { duration: 0.2, delay: delay * 0.1 },
      },
    }),
  };

  const nodeVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.6 + delay * 0.05,
        type: 'spring',
        stiffness: 300,
      },
    }),
  };

  const glowVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (delay: number) => ({
      opacity: [0, 1, 0.7],
      transition: {
        duration: 0.5,
        delay: 0.8 + delay * 0.1,
      },
    }),
  };

  return (
    <svg
      viewBox="0 0 200 140"
      width={size}
      height={size * 0.7}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {showGlow && (
          <>
            <filter id={ids.glow} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={ids.nodeGlow} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>

      {/* ================================================ */}
      {/* "C" LETTER - Left side                          */}
      {/* Double-outline rectangular shape with cut corners */}
      {/* ================================================ */}

      {/* C - Outer outline */}
      <motion.path
        d="M20 20 L70 20 L85 35 L85 45 L75 45 L75 40 L65 30 L30 30 L30 110 L65 110 L75 100 L75 95 L85 95 L85 105 L70 120 L20 120 Z"
        fill={c.inner}
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinejoin="round"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={0}
      />

      {/* C - Inner cutout (creates double-line effect) */}
      <motion.path
        d="M40 40 L60 40 L68 48 L68 52 L58 52 L55 49 L50 49 L50 91 L55 91 L58 88 L68 88 L68 92 L60 100 L40 100 Z"
        fill={color === 'white' ? 'transparent' : '#ffffff00'}
        stroke={c.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={1}
      />

      {/* ================================================ */}
      {/* "G" LETTER - Right side                         */}
      {/* Double-outline with crossbar and extending line */}
      {/* ================================================ */}

      {/* G - Outer outline */}
      <motion.path
        d="M95 20 L150 20 L165 35 L180 35 L180 45 L160 45 L160 40 L145 25 L105 25 L105 115 L145 115 L155 105 L155 80 L130 80 L130 70 L165 70 L165 110 L150 125 L95 125 Z"
        fill={c.inner}
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinejoin="round"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={2}
      />

      {/* G - Inner cutout */}
      <motion.path
        d="M115 35 L140 35 L148 43 L148 55 L138 55 L138 48 L135 45 L125 45 L125 95 L135 95 L138 92 L138 90 L148 90 L148 100 L140 108 L115 108 Z"
        fill={color === 'white' ? 'transparent' : '#ffffff00'}
        stroke={c.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={3}
      />

      {/* ================================================ */}
      {/* CONNECTION NODES - Small circles along traces   */}
      {/* ================================================ */}

      <motion.circle
        cx="25"
        cy="55"
        r="3"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={0}
      />
      <motion.circle
        cx="25"
        cy="70"
        r="4"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={1}
      />
      <motion.circle
        cx="25"
        cy="85"
        r="3"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={2}
      />
      <motion.circle
        cx="45"
        cy="70"
        r="2.5"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={3}
      />
      <motion.circle
        cx="148"
        cy="75"
        r="2.5"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={4}
      />
      <motion.circle
        cx="158"
        cy="75"
        r="2"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={5}
      />
      <motion.circle
        cx="125"
        cy="115"
        r="2.5"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={6}
      />

      {/* ================================================ */}
      {/* GLOWING NODES - Cyan highlights                 */}
      {/* ================================================ */}

      {showGlow && (
        <>
          <motion.circle
            cx="78"
            cy="38"
            r="5"
            fill={c.glow}
            filter={`url(#${ids.nodeGlow})`}
            variants={animated ? glowVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
            custom={0}
          />
          <motion.circle
            cx="78"
            cy="102"
            r="5"
            fill={c.glow}
            filter={`url(#${ids.nodeGlow})`}
            variants={animated ? glowVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
            custom={1}
          />
          <motion.circle
            cx="175"
            cy="40"
            r="5"
            fill={c.glow}
            filter={`url(#${ids.nodeGlow})`}
            variants={animated ? glowVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
            custom={2}
          />
          <motion.circle
            cx="155"
            cy="105"
            r="4"
            fill={c.glow}
            filter={`url(#${ids.nodeGlow})`}
            variants={animated ? glowVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
            custom={3}
          />
          <motion.circle
            cx="90"
            cy="70"
            r="3"
            fill={c.glow}
            filter={`url(#${ids.nodeGlow})`}
            variants={animated ? glowVariants : undefined}
            initial={animated ? 'hidden' : undefined}
            animate={animated ? 'visible' : undefined}
            custom={4}
          />
        </>
      )}

      {/* Extending lines from G top */}
      <motion.path
        d="M165 35 L175 35 L175 25"
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={4}
      />

      <motion.circle
        cx="175"
        cy="25"
        r="3"
        fill={c.nodes}
        variants={animated ? nodeVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={7}
      />
    </svg>
  );
}
