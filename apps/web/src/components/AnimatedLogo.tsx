/**
 * CGraph Animated Circuit Board Logo
 *
 * Elaborate animated version of the circuit board logo featuring:
 * - Sequential trace drawing (electricity flowing through circuits)
 * - Pulsing node effects (data nodes activating)
 * - Data packet flow animation (particles moving along traces)
 * - Central hub pulsing (the Graph connection point)
 * - Splash screen variant with full animation sequence
 * - Loading variant with continuous animation
 *
 * Perfect for:
 * - App splash screens
 * - Loading states
 * - Hero sections
 * - Authentication pages
 */

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useId } from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  variant?: 'default' | 'loading' | 'splash' | 'hero';
  onAnimationComplete?: () => void;
  color?: 'default' | 'cyan' | 'emerald' | 'purple';
}

const sizeMap = {
  sm: { container: 48, text: 'text-xl', logo: 40 },
  md: { container: 80, text: 'text-3xl', logo: 64 },
  lg: { container: 120, text: 'text-4xl', logo: 96 },
  xl: { container: 180, text: 'text-6xl', logo: 144 },
  hero: { container: 280, text: 'text-8xl', logo: 220 },
};

const colorPalettes = {
  default: {
    primary: '#00d4ff', // Cyan
    secondary: '#8b5cf6', // Purple
    tertiary: '#10b981', // Emerald
  },
  cyan: {
    primary: '#00d4ff',
    secondary: '#06b6d4',
    tertiary: '#0891b2',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    tertiary: '#06b6d4',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    tertiary: '#06b6d4',
  },
};

// Animation variants for drawing traces
const traceDrawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.6, delay, ease: 'easeOut' },
      opacity: { duration: 0.1, delay },
    },
  }),
};

// Animation variants for nodes appearing
const nodeAppearVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
      delay,
    },
  }),
};

// Continuous pulse for loading state
const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Main Animated Circuit Board Logo
 */
function CircuitBoardLogo({
  logoSize,
  isAnimated = false,
  isLoading = false,
  isSplash = false,
  color = 'default',
  onAnimationComplete,
}: {
  logoSize: number;
  isAnimated?: boolean;
  isLoading?: boolean;
  isSplash?: boolean;
  color?: 'default' | 'cyan' | 'emerald' | 'purple';
  onAnimationComplete?: () => void;
}) {
  const uniqueId = useId();
  const c = colorPalettes[color];
  const [showParticles, setShowParticles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Progress through animation phases for splash
  useEffect(() => {
    if (isSplash) {
      const timers = [
        setTimeout(() => setAnimationPhase(1), 800), // Traces drawn
        setTimeout(() => setAnimationPhase(2), 1600), // Nodes appear
        setTimeout(() => setAnimationPhase(3), 2200), // Particles start
        setTimeout(() => {
          setAnimationPhase(4);
          onAnimationComplete?.();
        }, 3500), // Complete
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

  const ids = {
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
        {/* Primary gradient */}
        <linearGradient id={ids.primaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.primary} stopOpacity="0.8" />
        </linearGradient>

        {/* Secondary gradient */}
        <linearGradient id={ids.secondaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.secondary} />
          <stop offset="100%" stopColor={c.secondary} stopOpacity="0.7" />
        </linearGradient>

        {/* Tertiary gradient */}
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

      {/* Background hexagon frame (optional, for hero variant) */}
      <motion.path
        d="M60 2L112 28V68L60 94L8 68V28L60 2Z"
        fill="none"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 0.2 } : { pathLength: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* ============================================ */}
      {/* "C" LETTER TRACES                           */}
      {/* ============================================ */}
      <g filter={`url(#${ids.glow})`}>
        {/* C - Main vertical left stroke */}
        <motion.path
          d="M18 20V48V76"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0}
        />

        {/* C - Top horizontal */}
        <motion.path
          d="M18 20H42"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.1}
        />

        {/* C - Top angle */}
        <motion.path
          d="M42 20V26L48 32"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.2}
        />

        {/* C - Bottom horizontal */}
        <motion.path
          d="M18 76H42"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.3}
        />

        {/* C - Bottom angle */}
        <motion.path
          d="M42 76V70L48 64"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.4}
        />

        {/* C - Middle branches */}
        <motion.path
          d="M18 48H30L36 42"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
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
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.55}
        />

        {/* C - Detail traces (purple) */}
        <motion.path
          d="M24 28H32L38 34"
          stroke={`url(#${ids.secondaryGrad})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.7"
          fill="none"
          variants={traceDrawVariants}
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
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.7 }}
          custom={0.65}
        />
      </g>

      {/* ============================================ */}
      {/* "G" LETTER TRACES                           */}
      {/* ============================================ */}
      <g filter={`url(#${ids.glow})`}>
        {/* G - Top horizontal */}
        <motion.path
          d="M72 20H102"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.1}
        />

        {/* G - Top left angle */}
        <motion.path
          d="M72 20V26L66 32"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.15}
        />

        {/* G - Right vertical top */}
        <motion.path
          d="M102 20V44"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.2}
        />

        {/* G - Middle crossbar */}
        <motion.path
          d="M102 48H84L78 42"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
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
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.4}
        />

        {/* G - Right vertical bottom */}
        <motion.path
          d="M102 52V76"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.45}
        />

        {/* G - Bottom horizontal */}
        <motion.path
          d="M72 76H102"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.5}
        />

        {/* G - Bottom left angle */}
        <motion.path
          d="M72 76V70L66 64"
          stroke={`url(#${ids.primaryGrad})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 1 }}
          custom={0.55}
        />

        {/* G - Detail traces (purple) */}
        <motion.path
          d="M96 28H88L82 34"
          stroke={`url(#${ids.secondaryGrad})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.7"
          fill="none"
          variants={traceDrawVariants}
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
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.7 }}
          custom={0.65}
        />

        {/* Connection traces (emerald) */}
        <motion.path
          d="M54 38H60L66 32"
          stroke={`url(#${ids.tertiaryGrad})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          fill="none"
          variants={traceDrawVariants}
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
          variants={traceDrawVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { pathLength: 1, opacity: 0.6 }}
          custom={0.75}
        />
      </g>

      {/* ============================================ */}
      {/* CIRCUIT NODES                               */}
      {/* ============================================ */}
      <g filter={`url(#${ids.nodeGlow})`}>
        {/* C nodes */}
        <motion.circle
          cx="18"
          cy="20"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.8}
        />
        <motion.circle
          cx="42"
          cy="20"
          r="2.5"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.85}
        />
        <motion.circle
          cx="48"
          cy="32"
          r="2"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.9}
        />
        <motion.circle
          cx="18"
          cy="48"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={isLoading ? pulseVariants : nodeAppearVariants}
          initial={isLoading ? undefined : 'hidden'}
          animate={isLoading ? 'pulse' : shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.95}
        />
        <motion.circle
          cx="18"
          cy="76"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.0}
        />
        <motion.circle
          cx="42"
          cy="76"
          r="2.5"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.05}
        />
        <motion.circle
          cx="48"
          cy="64"
          r="2"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.1}
        />

        {/* C secondary nodes (purple) */}
        <motion.circle
          cx="36"
          cy="42"
          r="2"
          fill={`url(#${ids.secondaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.15}
        />
        <motion.circle
          cx="36"
          cy="54"
          r="2"
          fill={`url(#${ids.secondaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.2}
        />
        <motion.circle
          cx="30"
          cy="48"
          r="1.5"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
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
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.9}
        />
        <motion.circle
          cx="102"
          cy="20"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={0.95}
        />
        <motion.circle
          cx="66"
          cy="32"
          r="2"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.0}
        />
        <motion.circle
          cx="102"
          cy="48"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={isLoading ? pulseVariants : nodeAppearVariants}
          initial={isLoading ? undefined : 'hidden'}
          animate={isLoading ? 'pulse' : shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.05}
        />
        <motion.circle
          cx="72"
          cy="76"
          r="2.5"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.1}
        />
        <motion.circle
          cx="102"
          cy="76"
          r="3"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.15}
        />
        <motion.circle
          cx="66"
          cy="64"
          r="2"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
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
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.25}
        />
        <motion.circle
          cx="78"
          cy="54"
          r="2"
          fill={`url(#${ids.secondaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.3}
        />
        <motion.circle
          cx="84"
          cy="48"
          r="1.5"
          fill={`url(#${ids.primaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.35}
        />
      </g>

      {/* ============================================ */}
      {/* CENTRAL HUB (The "Graph" connection)        */}
      {/* ============================================ */}
      <g filter={`url(#${ids.nodeGlow})`}>
        {/* Main hub circle */}
        <motion.circle
          cx="60"
          cy="48"
          r="6"
          fill={`url(#${ids.tertiaryGrad})`}
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 1 }}
          custom={1.5}
        />
        {/* Inner highlight */}
        <motion.circle
          cx="60"
          cy="48"
          r="3"
          fill="#fff"
          fillOpacity="0.5"
          variants={nodeAppearVariants}
          initial="hidden"
          animate={shouldAnimate ? 'visible' : { scale: 1, opacity: 0.5 }}
          custom={1.55}
        />
        {/* Pulsing ring */}
        {(isLoading || showParticles) && (
          <motion.circle
            cx="60"
            cy="48"
            r="8"
            fill="none"
            stroke={c.tertiary}
            strokeWidth="1.5"
            initial={{ r: 8, opacity: 0.8 }}
            animate={{
              r: [8, 16, 8],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </g>

      {/* ============================================ */}
      {/* DATA FLOW PARTICLES                         */}
      {/* ============================================ */}
      <AnimatePresence>
        {showParticles && (
          <g filter={`url(#${ids.particleGlow})`}>
            {/* Particle flowing down C */}
            <motion.circle
              r="2.5"
              fill={c.primary}
              initial={{ cx: 18, cy: 20, opacity: 0 }}
              animate={{
                cx: [18, 18, 18],
                cy: [20, 48, 76],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'linear',
              }}
            />

            {/* Particle flowing down G */}
            <motion.circle
              r="2.5"
              fill={c.primary}
              initial={{ cx: 102, cy: 20, opacity: 0 }}
              animate={{
                cx: [102, 102, 102],
                cy: [20, 48, 76],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.3,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'linear',
              }}
            />

            {/* Particle flowing from C to G through center */}
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

            {/* Additional accent particles */}
            <motion.circle
              r="1.5"
              fill={c.secondary}
              initial={{ cx: 24, cy: 28, opacity: 0 }}
              animate={{
                cx: [24, 30, 38],
                cy: [28, 30, 34],
                opacity: [0, 1, 0],
              }}
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
              animate={{
                cx: [96, 90, 82],
                cy: [28, 30, 34],
                opacity: [0, 1, 0],
              }}
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

/**
 * Main Animated Logo Component Export
 */
export default function AnimatedLogo({
  size = 'md',
  showText = true,
  variant = 'default',
  onAnimationComplete,
  color = 'default',
}: AnimatedLogoProps) {
  const [textVisible, setTextVisible] = useState(variant !== 'splash');
  const dimensions = sizeMap[size];
  const c = colorPalettes[color];

  useEffect(() => {
    if (variant === 'splash') {
      const timer = setTimeout(() => setTextVisible(true), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [variant]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo Container with optional glow backdrop */}
      <div className="relative">
        {/* Ambient glow behind logo */}
        {(variant === 'splash' || variant === 'hero') && (
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${c.primary}20 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.5 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        )}

        <CircuitBoardLogo
          logoSize={dimensions.logo}
          isAnimated={variant === 'default'}
          isLoading={variant === 'loading'}
          isSplash={variant === 'splash'}
          color={color}
          onAnimationComplete={onAnimationComplete}
        />
      </div>

      {/* Text with animation */}
      {showText && (
        <AnimatePresence>
          {textVisible && (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span
                className={`font-bold ${dimensions.text} tracking-tight`}
                style={{
                  background: `linear-gradient(135deg, ${c.primary}, ${c.secondary}, ${c.tertiary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                CGraph
              </motion.span>
              {variant === 'splash' && (
                <motion.span
                  className="mt-1 text-sm text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Secure • Connected • Decentralized
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// Named exports for specific use cases
export { CircuitBoardLogo };
