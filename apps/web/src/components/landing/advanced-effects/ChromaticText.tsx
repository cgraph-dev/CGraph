/**
 * ChromaticText Component
 * RGB chromatic aberration text effect
 */

import { motion } from 'framer-motion';
import { CHROMATIC_DEFAULT_OFFSET } from './constants';
import type { ChromaticTextProps } from './types';

export function ChromaticText({
  children,
  className = '',
  offset = CHROMATIC_DEFAULT_OFFSET,
}: ChromaticTextProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      {/* Red channel */}
      <motion.span
        className="absolute inset-0 text-red-500 mix-blend-screen"
        initial={{ x: -offset, opacity: 0 }}
        animate={{ x: -offset, opacity: 0.8 }}
        aria-hidden
      >
        {children}
      </motion.span>

      {/* Blue channel */}
      <motion.span
        className="absolute inset-0 text-blue-500 mix-blend-screen"
        initial={{ x: offset, opacity: 0 }}
        animate={{ x: offset, opacity: 0.8 }}
        aria-hidden
      >
        {children}
      </motion.span>

      {/* Main text */}
      <span className="relative">{children}</span>
    </span>
  );
}
