/**
 * DistortionWave Component
 * Animated wave distortion effect wrapper
 */

import { motion } from 'framer-motion';
import type { DistortionWaveProps } from './types';

export function DistortionWave({ children, className = '' }: DistortionWaveProps) {
  return (
    <motion.div
      className={className}
      animate={{
        skewX: [0, 2, -2, 0],
        skewY: [0, 1, -1, 0],
        scale: [1, 1.02, 0.98, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}
