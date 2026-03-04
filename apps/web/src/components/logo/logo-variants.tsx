/**
 * Logo Variant Components
 *
 * Additional logo presentations built on top of LogoIcon:
 * - LogoWithText: Logo + "CGraph" text label
 * - LogoSimple: Minimal version for small sizes
 * - LogoSquare: Square format for favicons/app icons
 * - LogoLoader: Spinning ring with embedded logo
 *
 * All variants use the official logo.png brand asset.
 *
 * @module components/logo/LogoVariants
 */

import { motion } from 'motion/react';
import { memo } from 'react';
import { colorPalettes } from './colors';
import { LogoIcon } from './logo-icon';
import type { LogoProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * Logo with text "CGraph" beside it.
 */
export const LogoWithText = memo(function LogoWithText({
  size = 40,
  className = '',
  color = 'default',
}: LogoProps) {
  const c = colorPalettes[color];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} />
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
});

/**
 * Simple/minimal logo for small sizes.
 */
export const LogoSimple = memo(function LogoSimple({
  size = 24,
  className = '',
}: Omit<LogoProps, 'animated' | 'showGlow'>) {
  return (
    <img
      src="/logo.png"
      alt="CGraph"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
});

/**
 * Square logo for favicons and app icons.
 */
export const LogoSquare = memo(function LogoSquare({ size = 32, className = '' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="CGraph"
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
});

/**
 * Loading spinner with embedded logo.
 */
export const LogoLoader = memo(function LogoLoader({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={loop(tweens.ambient)}
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
        <LogoSimple size={size * 0.5} />
      </div>
    </div>
  );
});
