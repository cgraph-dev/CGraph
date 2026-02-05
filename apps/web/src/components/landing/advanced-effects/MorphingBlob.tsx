/**
 * MorphingBlob Component
 * Animated SVG blob with morphing path animation
 */

import { motion } from 'framer-motion';
import { BLOB_DEFAULT_COLOR, BLOB_DEFAULT_SIZE, BLOB_DEFAULT_SPEED, BLOB_PATHS } from './constants';
import type { MorphingBlobProps } from './types';

export function MorphingBlob({
  color = BLOB_DEFAULT_COLOR,
  size = BLOB_DEFAULT_SIZE,
  className = '',
  speed = BLOB_DEFAULT_SPEED,
}: MorphingBlobProps) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 480 480"
      style={{ filter: `drop-shadow(0 0 30px ${color}50)` }}
    >
      <motion.path
        fill={color}
        initial={{ d: BLOB_PATHS[0] }}
        animate={{ d: BLOB_PATHS }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  );
}
