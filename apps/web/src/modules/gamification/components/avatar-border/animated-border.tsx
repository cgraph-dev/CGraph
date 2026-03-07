/**
 * AnimatedBorder Component
 *
 * Applies CSS-based animated border around avatar content.
 * Maps animation types to CSS class names defined in animated-border.css.
 *
 * Types `none` and `static` render without animation class.
 * Respects prefers-reduced-motion via CSS media query.
 *
 * @module avatar-border/animated-border
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import './animated-border.css';

/** All 13 animation types from the schema. */
export type BorderAnimationType =
  | 'none'
  | 'static'
  | 'pulse'
  | 'rotate'
  | 'shimmer'
  | 'wave'
  | 'breathe'
  | 'spin'
  | 'rainbow'
  | 'particles'
  | 'glow'
  | 'flow'
  | 'spark'
  | 'lottie';

export interface AnimatedBorderProps {
  /** Animation type for the border */
  animationType: BorderAnimationType;
  /** Primary border color (CSS color value) */
  borderColor?: string;
  /** Secondary border color */
  borderColorSecondary?: string;
  /** Accent border color */
  borderColorAccent?: string;
  /** Size in pixels */
  size?: number;
  /** Border thickness in pixels */
  borderWidth?: number;
  /** Content to render inside the border */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/** Animated types that use CSS class modifiers. */
const ANIMATED_TYPES = new Set<BorderAnimationType>([
  'pulse', 'rotate', 'shimmer', 'wave', 'breathe',
  'spin', 'rainbow', 'particles', 'glow', 'flow', 'spark',
]);

/** Types that render inner content inside a nested div for conic/linear gradient borders. */
const GRADIENT_BORDER_TYPES = new Set<BorderAnimationType>([
  'rotate', 'rainbow', 'flow',
]);

/** Number of particle elements for the particles animation. */
const PARTICLE_COUNT = 6;

/**
 * AnimatedBorder component.
 *
 * Wraps children with an animated CSS border. The animation type
 * determines which CSS class modifier is applied.
 */
export const AnimatedBorder = memo(function AnimatedBorder({
  animationType,
  borderColor = '#6366f1',
  borderColorSecondary,
  borderColorAccent,
  size = 80,
  borderWidth = 3,
  children,
  className,
}: AnimatedBorderProps) {
  const isAnimated = ANIMATED_TYPES.has(animationType);
  const isGradientBorder = GRADIENT_BORDER_TYPES.has(animationType);
  const isParticles = animationType === 'particles';

  const cssVars = useMemo(
    () =>
      ({
        '--border-color': borderColor,
        '--border-color-secondary': borderColorSecondary ?? borderColor,
        '--border-color-accent': borderColorAccent ?? borderColorSecondary ?? borderColor,
        '--border-width': `${borderWidth}px`,
        '--border-size': `${size}px`,
      }) as React.CSSProperties,
    [borderColor, borderColorSecondary, borderColorAccent, borderWidth, size],
  );

  const containerClass = cn(
    'avatar-border',
    isAnimated && 'avatar-border--animated',
    isAnimated && `avatar-border--${animationType}`,
    className,
  );

  // For `none` / `static`, just render children in a round container
  if (!isAnimated) {
    return (
      <div
        className={cn('avatar-border', className)}
        style={{
          ...cssVars,
          width: size,
          height: size,
          border: animationType === 'static' ? `${borderWidth}px solid ${borderColor}` : undefined,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={containerClass} style={{ ...cssVars, width: size, height: size }}>
      {/* Particle elements for the particles animation */}
      {isParticles &&
        Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <span key={i} className="avatar-border__particle" />
        ))}

      {/* Gradient border types need an inner wrapper to mask the gradient */}
      {isGradientBorder ? (
        <div
          className="avatar-border__inner"
          style={{
            width: size - borderWidth * 2,
            height: size - borderWidth * 2,
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
});

export default AnimatedBorder;
