import React from 'react';
import { motion } from 'framer-motion';

export type GradientVariant = 'emerald-purple' | 'fire' | 'ice' | 'cosmic';

const GRADIENT_PRESETS: Record<GradientVariant, string> = {
  'emerald-purple': 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
  fire: 'linear-gradient(135deg, #f97316 0%, #dc2626 50%, #fbbf24 100%)',
  ice: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #f0abfc 100%)',
  cosmic: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 33%, #f59e0b 66%, #10b981 100%)',
};

export interface GradientTextProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  /** Custom gradient CSS value (overrides variant) */
  gradient?: string;
  /** Enable animated gradient flow */
  animated?: boolean;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p';
}

/**
 * GradientText - Core UI Primitive
 *
 * Renders text with animated gradient fills matching the Neural Glass design system.
 * Supports Emerald-Purple branding and special effect variants (Fire, Ice, Cosmic).
 *
 * @example
 * <GradientText variant="emerald-purple" animated>
 *   Communication Reimagined
 * </GradientText>
 */
export const GradientText = React.memo(function GradientText({
  children,
  variant = 'emerald-purple',
  gradient,
  animated = false,
  className = '',
  as: Component = 'span',
}: GradientTextProps) {
  const gradientValue = gradient || GRADIENT_PRESETS[variant];

  const baseStyle: React.CSSProperties = {
    background: gradientValue,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    backgroundSize: animated ? '200% auto' : '100% auto',
  };

  if (animated) {
    return (
      <motion.span
        className={`gradient-text ${className}`}
        style={baseStyle}
        animate={{
          backgroundPosition: ['0% center', '200% center'],
        }}
        transition={{
          duration: 3,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {children}
      </motion.span>
    );
  }

  return React.createElement(
    Component,
    {
      className: `gradient-text ${className}`,
      style: baseStyle,
    },
    children
  );
});
