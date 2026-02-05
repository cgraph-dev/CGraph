/**
 * AuroraBackground Component
 * Animated aurora-style gradient background
 */

import { motion } from 'framer-motion';
import { AURORA_DEFAULT_COLORS, AURORA_DEFAULT_SPEED } from './constants';
import type { AuroraBackgroundProps } from './types';

export function AuroraBackground({
  colors = AURORA_DEFAULT_COLORS,
  className = '',
  speed = AURORA_DEFAULT_SPEED,
}: AuroraBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute h-[200%] w-[200%]"
          style={{
            background: `radial-gradient(ellipse at center, ${color}40, transparent 50%)`,
            left: `${(index % 2) * 50 - 50}%`,
            top: `${Math.floor(index / 2) * 50 - 50}%`,
          }}
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -50, 100, -50, 0],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: speed + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 2,
          }}
        />
      ))}
    </div>
  );
}
