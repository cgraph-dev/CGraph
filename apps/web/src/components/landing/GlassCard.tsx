/**
 * GlassCard Component - Glassmorphism card with 2026 styling
 *
 * Features:
 * - Frosted glass effect with backdrop-filter
 * - Color tint variants (emerald, purple, cyan)
 * - Hover animations with glow effects
 * - Accessible and responsive
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animation-presets/presets';

// ============================================================================
// TYPES
// ============================================================================

type GlassCardVariant = 'default' | 'emerald' | 'purple' | 'cyan';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Card content */
  children: ReactNode;
  /** Color variant */
  variant?: GlassCardVariant;
  /** Enable hover scale animation */
  hoverable?: boolean;
  /** Enable glow pulse animation */
  glowing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const VARIANT_CLASSES: Record<GlassCardVariant, string> = {
  default: 'glass-card',
  emerald: 'glass-card glass-card--emerald',
  purple: 'glass-card glass-card--purple',
  cyan: 'glass-card glass-card--cyan',
};

const GLOW_CLASSES: Record<GlassCardVariant, string> = {
  default: 'glow-button',
  emerald: 'glow-button',
  purple: '',
  cyan: 'glow-button-cyan',
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const cardVariants = {
  rest: {
    scale: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    rotateX: 2,
    rotateY: 2,
    transition: springs.bouncy,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, variant = 'default', hoverable = true, glowing = false, className, ...props },
  ref
) {
  const variantClass = VARIANT_CLASSES[variant];
  const glowClass = glowing ? GLOW_CLASSES[variant] : '';

  return (
    <motion.div
      ref={ref}
      className={cn(variantClass, glowClass, 'relative', className)}
      variants={hoverable ? cardVariants : undefined}
      initial="rest"
      whileHover={hoverable ? 'hover' : undefined}
      {...props}
    >
      {/* Inner glow effect on hover */}
      {hoverable && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(255, 255, 255, 0.1) 0%,
                transparent 60%)`,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {children}
    </motion.div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { GlassCardProps, GlassCardVariant };
