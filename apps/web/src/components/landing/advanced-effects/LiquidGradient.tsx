/**
 * LiquidGradient Component
 * Animated liquid gradient background effect
 */

import { motion } from 'framer-motion';
import { GRADIENT_DEFAULT_COLORS, GRADIENT_DEFAULT_SPEED } from './constants';
import type { LiquidGradientProps } from './types';

export function LiquidGradient({
  colors = GRADIENT_DEFAULT_COLORS,
  className = '',
  speed = GRADIENT_DEFAULT_SPEED,
}: LiquidGradientProps) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        background: `linear-gradient(-45deg, ${colors.join(', ')})`,
        backgroundSize: '400% 400%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
