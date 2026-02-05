/**
 * AnimatedBorder Component
 * Container with animated gradient border
 */

import { DEFAULT_COLORS, DEFAULT_BORDER_RADIUS } from './constants';
import type { AnimatedBorderProps } from './types';

export function AnimatedBorder({
  children,
  className = '',
  colors = DEFAULT_COLORS,
  borderRadius = DEFAULT_BORDER_RADIUS,
  glowOnHover = true,
}: AnimatedBorderProps) {
  const gradient = `linear-gradient(90deg, ${colors.join(', ')}, ${colors[0]})`;

  return (
    <div className={`group relative ${className}`}>
      {/* Glow effect on hover */}
      {glowOnHover && (
        <div
          className="absolute -inset-[1px] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
          style={{
            borderRadius,
            background: gradient,
          }}
        />
      )}
      {/* Animated border */}
      <div
        className="absolute -inset-[1px] opacity-30"
        style={{
          borderRadius,
          background: gradient,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      />
      {/* Content container */}
      <div className="relative bg-gray-900/90 backdrop-blur-xl" style={{ borderRadius }}>
        {children}
      </div>
    </div>
  );
}
