/**
 * GlowText Component
 * Text with gradient glow effect
 */

import { DEFAULT_COLORS } from './constants';
import type { GlowTextProps } from './types';

export function GlowText({ children, className = '', colors = DEFAULT_COLORS }: GlowTextProps) {
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;

  return (
    <span className={`relative ${className}`}>
      <span
        className="absolute inset-0 bg-clip-text text-transparent opacity-50 blur-xl"
        style={{ backgroundImage: gradient }}
      >
        {children}
      </span>
      <span
        className="relative bg-clip-text text-transparent"
        style={{ backgroundImage: gradient }}
      >
        {children}
      </span>
    </span>
  );
}
