/**
 * @description GradientText — animated gradient text with brand colors.
 * Replicates the "Reimagined" gradient text from the landing page.
 * @module components/ui/gradient-text
 */
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  animate?: boolean;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

/** Renders text with an animated brand gradient (purple → cyan → teal). */
export function GradientText({
  children,
  animate = true,
  className = '',
  from = '#a78bfa',
  via = '#06b6d4',
  to = '#10b981',
}: GradientTextProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
        backgroundSize: shouldAnimate ? '200% auto' : '100% auto',
      }}
      animate={
        shouldAnimate
          ? { backgroundPosition: ['0% center', '100% center', '0% center'] }
          : undefined
      }
      transition={shouldAnimate ? { duration: 4, repeat: Infinity, ease: 'linear' } : undefined}
    >
      {children}
    </motion.span>
  );
}
