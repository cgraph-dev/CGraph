/**
 * Auth page text animation effects.
 * @module
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from './constants';
import type { ScanLinesProps, GlitchTextProps } from './types';

/**
 * ScanLines Component
 *
 * CRT monitor scan line overlay effect
 */
export const ScanLines = memo(function ScanLines({ opacity = 0.03 }: ScanLinesProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, ${opacity}),
          rgba(0, 0, 0, ${opacity}) 1px,
          transparent 1px,
          transparent 2px
        )`,
      }}
    />
  );
});

/**
 * GlitchText Component
 *
 * Text with RGB split glitch effect
 */
export const GlitchText = memo(function GlitchText({ text, className = '' }: GlitchTextProps) {
  if (prefersReducedMotion()) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      {/* Cyan layer — top half */}
      <motion.span
        className="absolute inset-0 text-cyan-400"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
        animate={{
          x: [-3, 3, -1, 2, -3],
          opacity: [0, 0.9, 0.7, 0.9, 0],
        }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatDelay: 2.5,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
      {/* Red layer — bottom half */}
      <motion.span
        className="absolute inset-0 text-red-400"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
        animate={{
          x: [3, -3, 1, -2, 3],
          opacity: [0, 0.9, 0.7, 0.9, 0],
        }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatDelay: 2.5,
          delay: 0.05,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
      {/* Full glitch flash */}
      <motion.span
        className="absolute inset-0 text-violet-300"
        animate={{
          opacity: [0, 0, 0.6, 0, 0],
          x: [0, -4, 4, -2, 0],
          skewX: [0, 0, -5, 5, 0],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 4,
          delay: 1,
        }}
      >
        {text}
      </motion.span>
    </span>
  );
});

export default ScanLines;
