/**
 * ScrollProgress Component
 * Fixed scroll progress indicator
 */

import { motion, useScroll, useSpring } from 'framer-motion';
import { DEFAULT_PROGRESS_COLOR } from './constants';
import type { ScrollProgressProps } from './types';

export function ScrollProgress({
  className = '',
  color = DEFAULT_PROGRESS_COLOR,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className={`fixed left-0 right-0 top-0 z-50 h-1 origin-left ${className}`}
      style={{ scaleX, backgroundColor: color }}
    />
  );
}
