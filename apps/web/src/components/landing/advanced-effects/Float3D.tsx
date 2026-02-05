/**
 * Float3D Component
 * 3D floating animation effect
 */

import { motion } from 'framer-motion';
import { FLOAT_DEFAULT_RANGE, FLOAT_DEFAULT_SPEED } from './constants';
import type { Float3DProps } from './types';

export function Float3D({
  children,
  className = '',
  range = FLOAT_DEFAULT_RANGE,
  speed = FLOAT_DEFAULT_SPEED,
  rotate = true,
  delay = 0,
}: Float3DProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
      animate={{
        y: [0, -range, 0],
        rotateX: rotate ? [0, 10, 0] : 0,
        rotateY: rotate ? [0, 15, 0] : 0,
        rotateZ: rotate ? [0, 5, 0] : 0,
      }}
      transition={{
        duration: speed,
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
