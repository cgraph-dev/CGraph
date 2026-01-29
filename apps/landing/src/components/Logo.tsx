/**
 * CGraph Circuit Board Logo
 *
 * A PCB-styled "CG" monogram with:
 * - Double-outline strokes (like circuit board traces)
 * - Angular/octagonal letter shapes with cut corners
 * - Small circular connection nodes
 * - Cyan glowing highlights at key points
 * - Overlapping C and G in the center
 */

import { motion } from 'framer-motion';
import { useMemo, useId } from 'react';

export type LogoColorVariant =
  | 'default'
  | 'cyan'
  | 'emerald'
  | 'purple'
  | 'white'
  | 'dark'
  | 'gradient';

export interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  color?: LogoColorVariant;
  showGlow?: boolean;
}

// Color configurations
const colorPalettes = {
  default: {
    stroke: '#1a1a1a',
    inner: '#ffffff',
    glow: '#00d4ff',
    nodes: '#1a1a1a',
  },
  cyan: {
    stroke: '#0891b2',
    inner: '#ecfeff',
    glow: '#00d4ff',
    nodes: '#0891b2',
  },
  emerald: {
    stroke: '#047857',
    inner: '#ecfdf5',
    glow: '#10b981',
    nodes: '#047857',
  },
  purple: {
    stroke: '#7c3aed',
    inner: '#f5f3ff',
    glow: '#8b5cf6',
    nodes: '#7c3aed',
  },
  white: {
    stroke: '#ffffff',
    inner: 'transparent',
    glow: '#00d4ff',
    nodes: '#ffffff',
  },
  dark: {
    stroke: '#0f172a',
    inner: '#f8fafc',
    glow: '#00d4ff',
    nodes: '#0f172a',
  },
  gradient: {
    stroke: '#1a1a1a',
    inner: '#ffffff',
    glow: '#00d4ff',
    nodes: '#1a1a1a',
  },
};

/**
 * Main CG Circuit Board Logo
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
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.8, delay: delay * 0.1, ease: 'easeInOut' as const },
        opacity: { duration: 0.2, delay: delay * 0.1 },
      },
    }),
  };

  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.6 + delay * 0.05,
        type: 'spring' as const,
        stiffness: 300,
      },
    }),
  };

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: (delay: number) => ({
      opacity: [0, 1, 0.7],
      transition: {
        duration: 0.5,
        delay: 0.8 + delay * 0.1,
      },
    }),
  };

  // The SVG paths that create the double-outline "CG" design
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
            <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={c.glow} />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={ids.nodeGlow} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor={c.glow} />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>

      {/* C outer */}
      <motion.path
        d="M95 15 L30 15 L15 30 L15 110 L30 125 L95 125"
        stroke={c.stroke}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={0}
      />

      {/* C inner */}
      <motion.path
        d="M85 35 L40 35 L30 45 L30 95 L40 105 L85 105"
        stroke={c.inner}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={1}
      />

      {/* G outer */}
      <motion.path
        d="M105 15 L170 15 L185 30 L185 110 L170 125 L105 125 L105 85 L145 85"
        stroke={c.stroke}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={2}
      />

      {/* G inner */}
      <motion.path
        d="M115 35 L160 35 L170 45 L170 95 L160 105 L120 105 L120 75 L145 75"
        stroke={c.inner}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        variants={animated ? pathVariants : undefined}
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
        custom={3}
      />

      {/* Connection nodes */}
      {[
        { cx: 95, cy: 15 },
        { cx: 15, cy: 70 },
        { cx: 95, cy: 125 },
        { cx: 105, cy: 15 },
        { cx: 185, cy: 70 },
        { cx: 105, cy: 125 },
        { cx: 145, cy: 85 },
      ].map((node, i) => (
        <motion.circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r="5"
          fill={c.nodes}
          filter={showGlow ? `url(#${ids.nodeGlow})` : undefined}
          variants={animated ? nodeVariants : undefined}
          initial={animated ? 'hidden' : undefined}
          animate={animated ? 'visible' : undefined}
          custom={i}
        />
      ))}

      {/* Glow points */}
      {showGlow && (
        <>
          {[
            { cx: 100, cy: 15 },
            { cx: 100, cy: 125 },
            { cx: 145, cy: 85 },
          ].map((glow, i) => (
            <motion.circle
              key={`glow-${i}`}
              cx={glow.cx}
              cy={glow.cy}
              r="3"
              fill={c.glow}
              filter={`url(#${ids.glow})`}
              variants={animated ? glowVariants : undefined}
              initial={animated ? 'hidden' : undefined}
              animate={animated ? 'visible' : undefined}
              custom={i}
            />
          ))}
        </>
      )}
    </svg>
  );
}
