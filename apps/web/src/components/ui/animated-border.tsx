/**
 * AnimatedBorder Component
 * 
 * Gradient animated border with glow effects.
 * Creates eye-catching containers with gaming-style borders.
 */

import { durations } from '@cgraph/animation-constants';
import { type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Border gradient colors */
  gradient?: string[];
  /** Border width */
  borderWidth?: number;
  /** Border radius */
  borderRadius?: number | string;
  /** Enable rotation animation */
  animate?: boolean;
  /** Animation speed in seconds */
  animationSpeed?: number;
  /** Enable glow effect */
  glow?: boolean;
  /** Glow intensity */
  glowIntensity?: number;
  /** Enable pulse effect */
  pulse?: boolean;
}

/**
 * Animated Border component.
 */
export default function AnimatedBorder({
  children,
  className = '',
  style,
  gradient = ['#667eea', '#764ba2', '#667eea'],
  borderWidth = 2,
  borderRadius = 12,
  animate = true,
  animationSpeed = 3,
  glow = true,
  glowIntensity = 0.5,
  pulse = false,
}: AnimatedBorderProps) {
  const gradientString = `conic-gradient(from 0deg, ${gradient.join(', ')})`;

  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute -inset-px -z-10"
        style={{
          background: gradientString,
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius + 1}px` : borderRadius,
          padding: borderWidth,
        }}
        animate={animate ? { rotate: 360 } : undefined}
        transition={animate ? {
          duration: animationSpeed,
          repeat: Infinity,
          ease: 'linear',
        } : undefined}
      />

      {/* Glow effect */}
      {glow && (
        <motion.div
          className="absolute -inset-1 -z-20"
          style={{
            background: gradientString,
            borderRadius: typeof borderRadius === 'number' ? `${borderRadius + 4}px` : borderRadius,
            filter: `blur(${8 * glowIntensity}px)`,
            opacity: glowIntensity * 0.6,
          }}
          animate={animate ? { rotate: 360 } : undefined}
          transition={animate ? {
            duration: animationSpeed,
            repeat: Infinity,
            ease: 'linear',
          } : undefined}
        />
      )}

      {/* Pulse overlay */}
      {pulse && (
        <motion.div
          className="absolute -inset-2 -z-30"
          style={{
            background: `radial-gradient(circle, ${gradient[0]}40 0%, transparent 70%)`,
            borderRadius: typeof borderRadius === 'number' ? `${borderRadius + 8}px` : borderRadius,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Inner content container */}
      <div
        className="relative z-10 h-full w-full"
        style={{
          background: 'var(--card-background, hsl(var(--card)))',
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius - 1}px` : borderRadius,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Gaming-style badge border with rotating particles
 */
export function BadgeBorder({
  children,
  className = '',
  rarity = 'common',
}: {
  children: ReactNode;
  className?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}) {
  const rarityGradients = {
    common: ['#9ca3af', '#6b7280', '#9ca3af'],
    rare: ['#60a5fa', '#3b82f6', '#60a5fa'],
    epic: ['#a78bfa', '#8b5cf6', '#a78bfa'],
    legendary: ['#fbbf24', '#f59e0b', '#fbbf24'],
    mythic: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b'],
  };

  const glowIntensities = {
    common: 0.2,
    rare: 0.4,
    epic: 0.6,
    legendary: 0.8,
    mythic: 1.0,
  };

  return (
    <AnimatedBorder
      className={className}
      gradient={rarityGradients[rarity]}
      borderWidth={rarity === 'legendary' || rarity === 'mythic' ? 3 : 2}
      borderRadius={16}
      glow={rarity !== 'common'}
      glowIntensity={glowIntensities[rarity]}
      pulse={rarity === 'legendary' || rarity === 'mythic'}
      animationSpeed={rarity === 'mythic' ? 2 : 3}
    >
      {children}
    </AnimatedBorder>
  );
}

/**
 * Neon-style border
 */
export function NeonBorder({
  children,
  className = '',
  color = '#00ffff',
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <AnimatedBorder
      className={className}
      gradient={[color, `${color}80`, color]}
      borderWidth={2}
      borderRadius={8}
      animate={false}
      glow
      glowIntensity={0.8}
    >
      {children}
    </AnimatedBorder>
  );
}
