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
      <motion.span
        className="absolute inset-0 text-cyan-400 opacity-80"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
        animate={{
          x: [-2, 2, -2],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-red-400 opacity-80"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
        animate={{
          x: [2, -2, 2],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: 3,
          delay: 0.05,
        }}
      >
        {text}
      </motion.span>
    </span>
  );
});

export default ScanLines;
