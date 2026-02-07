/**
 * Logo Variant Components
 *
 * Additional logo presentations built on top of LogoIcon:
 * - LogoWithText: Logo + "CGraph" text label
 * - LogoSimple: Minimal version for small sizes
 * - LogoSquare: Square format for favicons/app icons
 * - LogoLoader: Spinning ring with embedded logo
 *
 * @module components/logo/LogoVariants
 */

import { motion } from 'framer-motion';
import { useId } from 'react';
import { colorPalettes } from './colors';
import { LogoIcon } from './LogoIcon';
import type { LogoProps } from './types';

/**
 * Logo with text "CGraph" beside it.
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
 * Simple/minimal logo for small sizes (no animation or glow).
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
 * Square logo for favicons and app icons.
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

      <g transform="translate(8, 14) scale(0.38)">
        <path
          d="M10 10 L40 10 L50 20 L50 28 L42 28 L38 24 L20 24 L20 80 L38 80 L42 76 L50 76 L50 84 L40 94 L10 94 Z"
          fill="transparent"
          stroke={c.glow}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M58 10 L90 10 L100 20 L112 20 L112 28 L98 28 L95 24 L68 24 L68 80 L95 80 L100 75 L100 58 L82 58 L82 50 L108 50 L108 82 L98 94 L58 94 Z"
          fill="transparent"
          stroke={c.glow}
          strokeWidth="4"
          strokeLinejoin="round"
        />
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
 * Loading spinner with embedded logo.
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
