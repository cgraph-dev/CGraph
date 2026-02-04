/**
 * ScrollProgress Component - Fixed scroll progress indicator
 *
 * Features:
 * - Smooth progress bar at top of page
 * - Tri-color gradient animation
 * - Framer Motion scroll tracking
 * - Respects reduced motion preferences
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ScrollProgressProps {
  /** Height of the progress bar in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the progress bar */
  show?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ScrollProgress = memo(function ScrollProgress({
  height = 3,
  className,
  show = true,
}: ScrollProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Smooth spring animation for the progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (!show) return null;

  // Static rendering for reduced motion
  if (prefersReducedMotion) {
    return (
      <motion.div
        className={cn('scroll-progress', className)}
        style={{
          height,
          scaleX: scrollYProgress,
          transformOrigin: '0%',
        }}
      />
    );
  }

  return (
    <motion.div
      className={cn('scroll-progress', className)}
      style={{
        height,
        scaleX,
        transformOrigin: '0%',
      }}
    />
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { ScrollProgressProps };
