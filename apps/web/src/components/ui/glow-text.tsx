/**
 * GlowText Component
 *
 * Gradient text with animated glow effect.
 * Creates eye-catching headers and titles.
 */

import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface GlowTextProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Gradient colors (CSS gradient string or array of colors) */
  gradient?: string | string[];
  /** Enable glow animation */
  animate?: boolean;
  /** Glow intensity */
  glowIntensity?: 'low' | 'medium' | 'high';
  /** Text size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Enable shimmer effect */
  shimmer?: boolean;
  /** HTML element to render */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const glowIntensities = {
  low: 0.3,
  medium: 0.5,
  high: 0.8,
};

const glowBlur = {
  low: '8px',
  medium: '16px',
  high: '24px',
};

/**
 *
 */
export default function GlowText({
  children,
  className = '',
  style,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  animate = true,
  glowIntensity = 'medium',
  size = 'xl',
  shimmer = false,
  as: Component = 'span',
}: GlowTextProps) {
  // Parse gradient
  const gradientValue = Array.isArray(gradient)
    ? `linear-gradient(135deg, ${gradient.join(', ')})`
    : gradient;

  // Extract primary color for glow (simple extraction from gradient)
  const _primaryColor = Array.isArray(gradient)
    ? gradient[0]
    : gradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb[a]?\([^)]+\)/)?.[0] || '#667eea';
  void _primaryColor; // Reserved for future enhanced glow effects

  const MotionComponent = motion[Component] as typeof motion.span; // type assertion: dynamic motion component access returns compatible type

  return (
    <MotionComponent
      className={`relative inline-block font-bold ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {/* Glow layer (behind) */}
      {animate && (
        <motion.span
          className="absolute inset-0 -z-10"
          style={{
            background: gradientValue,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            filter: `blur(${glowBlur[glowIntensity]})`,
            opacity: glowIntensities[glowIntensity],
          }}
          animate={{
            opacity: [
              glowIntensities[glowIntensity],
              glowIntensities[glowIntensity] * 1.5,
              glowIntensities[glowIntensity],
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {children}
        </motion.span>
      )}

      {/* Main text */}
      <span
        className="relative"
        style={{
          background: gradientValue,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          backgroundSize: shimmer ? '200% 100%' : '100% 100%',
        }}
      >
        {children}
      </span>

      {/* Shimmer overlay */}
      {shimmer && (
        <motion.span
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
          animate={{
            backgroundPosition: ['200% 0%', '-200% 0%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {children}
        </motion.span>
      )}
    </MotionComponent>
  );
}

/**
 * Fire-animated text for legendary/epic items
 */
export function FireText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <GlowText
      className={className}
      size={size}
      gradient={['#ff4500', '#ff8c00', '#ffd700']}
      glowIntensity="high"
      shimmer
    >
      {children}
    </GlowText>
  );
}

/**
 * Electric-animated text for rare items
 */
export function ElectricText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <GlowText
      className={className}
      size={size}
      gradient={['#00ffff', '#0080ff', '#8000ff']}
      glowIntensity="high"
      shimmer
    >
      {children}
    </GlowText>
  );
}

/**
 * Rainbow-animated text for special occasions
 */
export function RainbowText({
  children,
  className = '',
  size = 'xl',
}: {
  children: ReactNode;
  className?: string;
  size?: GlowTextProps['size'];
}) {
  return (
    <motion.span
      className={`relative inline-block font-bold ${sizeClasses[size]} ${className}`}
      style={{
        background:
          'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff00ff, #ff0000)',
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%'],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}
