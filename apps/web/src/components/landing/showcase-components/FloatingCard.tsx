/**
 * FloatingCard Component
 * Card with floating animation effect
 */

import { motion } from 'framer-motion';
import { DEFAULT_FLOAT_RANGE, DEFAULT_ROTATE_RANGE, DEFAULT_FLOAT_DURATION } from './constants';
import type { FloatingCardProps } from './types';

export function FloatingCard({
  children,
  delay = 0,
  className = '',
  floatRange = DEFAULT_FLOAT_RANGE,
  rotateRange = DEFAULT_ROTATE_RANGE,
}: FloatingCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotateX: 0, rotateY: 0 }}
      animate={{
        y: [0, -floatRange, 0],
        rotateX: [-rotateRange, rotateRange, -rotateRange],
        rotateY: [-rotateRange, rotateRange, -rotateRange],
      }}
      transition={{
        duration: DEFAULT_FLOAT_DURATION,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}
