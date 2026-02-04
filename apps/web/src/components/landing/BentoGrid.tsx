/**
 * BentoGrid Component - Modern bento-style grid layout
 *
 * Features:
 * - Apple/Linear-style bento layout
 * - Responsive grid with breakpoints
 * - Size variants (small, medium, large, wide, tall)
 * - Works with GlassCard components
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { forwardRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type BentoItemSize = 'small' | 'medium' | 'large' | 'wide' | 'tall';

interface BentoGridProps {
  /** Grid items */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

interface BentoItemProps {
  /** Item content */
  children: ReactNode;
  /** Size variant */
  size?: BentoItemSize;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const SIZE_CLASSES: Record<BentoItemSize, string> = {
  small: 'bento-small',
  medium: 'bento-medium',
  large: 'bento-large',
  wide: 'bento-wide',
  tall: 'bento-tall',
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ============================================================================
// BENTO GRID COMPONENT
// ============================================================================

export const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(function BentoGrid(
  { children, className },
  ref
) {
  return (
    <motion.div
      ref={ref}
      className={cn('bento-grid', className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// BENTO ITEM COMPONENT
// ============================================================================

export const BentoItem = forwardRef<HTMLDivElement, BentoItemProps>(function BentoItem(
  { children, size = 'small', className },
  ref
) {
  return (
    <motion.div
      ref={ref}
      className={cn(SIZE_CLASSES[size], className)}
      variants={itemVariants}
      whileHover={{
        scale: 1.02,
        transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
      }}
    >
      {children}
    </motion.div>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { BentoGridProps, BentoItemProps, BentoItemSize };
