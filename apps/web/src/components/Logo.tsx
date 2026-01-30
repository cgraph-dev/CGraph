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

import { motion, type Variants } from 'framer-motion';
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
 * Matches the provided design with double-outline PCB style
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

  // The SVG paths that create the double-outline "CG" design
  // ViewBox is 200x140 to match the proportions of the logo
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
        {/* Glow filter for cyan highlights */}
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

      {/* Left side nodes on C */}
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

      {/* Small connector nodes */}
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

      {/* G crossbar nodes */}
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

      {/* Bottom connector on G */}
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
          {/* Top-left C glow */}
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

          {/* Bottom-left C glow */}
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

          {/* Top-right G extension glow */}
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

          {/* G crossbar area glow */}
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

          {/* Center connection glow */}
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

      {/* Small connecting line on G top */}
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

/**
 * Logo with text "CGraph" beside it
 */
export function LogoWithText({
  size = 40,
  className = '',
  animated = false,
  color = 'default',
  showGlow = true,
}: LogoProps) {
  const c = colorPalettes[color];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} animated={animated} color={color} showGlow={showGlow} />
      <span
        className="font-bold tracking-tight"
        style={{
          fontSize: size * 0.6,
          color: color === 'white' ? '#ffffff' : c.stroke,
          fontFamily: "'Orbitron', 'Outfit', sans-serif",
        }}
      >
        CGraph
      </span>
    </div>
  );
}

/**
 * Simple/minimal logo for small sizes
 */
export function LogoSimple({
  size = 24,
  className = '',
  color = 'default',
}: Omit<LogoProps, 'animated' | 'showGlow'>) {
  const c = colorPalettes[color];

  return (
    <svg
      viewBox="0 0 100 70"
      width={size}
      height={size * 0.7}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified C */}
      <path
        d="M10 10 L35 10 L42 17 L42 22 L37 22 L32 17 L15 17 L15 53 L32 53 L37 48 L42 48 L42 53 L35 60 L10 60 Z"
        fill={c.inner}
        stroke={c.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Simplified G */}
      <path
        d="M48 10 L75 10 L82 17 L90 17 L90 22 L80 22 L80 17 L72 10 L53 17 L53 53 L72 53 L78 47 L78 40 L65 40 L65 35 L83 35 L83 52 L75 60 L48 60 Z"
        fill={c.inner}
        stroke={c.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Glow dots */}
      <circle cx="40" cy="17" r="3" fill="#00d4ff" />
      <circle cx="40" cy="53" r="3" fill="#00d4ff" />
      <circle cx="88" cy="20" r="3" fill="#00d4ff" />
    </svg>
  );
}

/**
 * Square logo for favicons and app icons
 */
export function LogoSquare({
  size = 32,
  className = '',
  color = 'default',
  showGlow = true,
}: LogoProps) {
  const c = colorPalettes[color];
  const uniqueId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="64" height="64" rx="12" fill="#0f172a" />

      {showGlow && (
        <defs>
          <filter id={`sq-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Compact CG */}
      <g transform="translate(8, 14) scale(0.38)">
        {/* C outer */}
        <path
          d="M10 10 L40 10 L50 20 L50 28 L42 28 L38 24 L20 24 L20 80 L38 80 L42 76 L50 76 L50 84 L40 94 L10 94 Z"
          fill="transparent"
          stroke={c.glow}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* G outer */}
        <path
          d="M58 10 L90 10 L100 20 L112 20 L112 28 L98 28 L95 24 L68 24 L68 80 L95 80 L100 75 L100 58 L82 58 L82 50 L108 50 L108 82 L98 94 L58 94 Z"
          fill="transparent"
          stroke={c.glow}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Glow points */}
        <circle
          cx="48"
          cy="22"
          r="5"
          fill={c.glow}
          filter={showGlow ? `url(#sq-glow-${uniqueId})` : undefined}
        />
        <circle
          cx="48"
          cy="82"
          r="5"
          fill={c.glow}
          filter={showGlow ? `url(#sq-glow-${uniqueId})` : undefined}
        />
        <circle
          cx="110"
          cy="24"
          r="5"
          fill={c.glow}
          filter={showGlow ? `url(#sq-glow-${uniqueId})` : undefined}
        />
      </g>
    </svg>
  );
}

/**
 * Loading spinner with logo
 */
export function LogoLoader({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="2"
            strokeDasharray="70 200"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <LogoSimple size={size * 0.5} color="cyan" />
      </div>
    </div>
  );
}

export default LogoIcon;
