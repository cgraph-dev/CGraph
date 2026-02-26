/**
 * Fire Animation Component
 *
 * Animated fire icon for streak display
 */

import { motion } from 'framer-motion';
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';
import { FIRE_COLORS, GLOW_COLOR } from './constants';
import { tweens, loop } from '@/lib/animation-presets';

interface FireAnimationProps {
  currentStreak: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * unknown for the gamification module.
 */
/**
 * Fire Animation component.
 */
export function FireAnimation({ currentStreak, size = 'large' }: FireAnimationProps) {
  const sizeClasses = {
    small: 'h-10 w-10',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  const fireColor = currentStreak >= 7 ? FIRE_COLORS.medium : FIRE_COLORS.low;

  return (
    <motion.div
      className="relative"
      animate={{ scale: [1, 1.1, 1] }}
      transition={loop(tweens.verySlow)}
    >
      <FireIconSolid className={sizeClasses[size]} style={{ color: fireColor }} />
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.3, 1],
        }}
        transition={loop(tweens.slow)}
      >
        <FireIconSolid
          className={sizeClasses[size]}
          style={{ color: GLOW_COLOR, filter: 'blur(8px)' }}
        />
      </motion.div>
    </motion.div>
  );
}
