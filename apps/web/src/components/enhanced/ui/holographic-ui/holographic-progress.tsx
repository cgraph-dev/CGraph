/**
 * Holographic-styled progress bar.
 * @module
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTheme } from './constants';
import type { HolographicProgressProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * HolographicProgress Component
 *
 * Animated progress bar with shine effect
 */
export function HolographicProgress({
  value,
  showLabel = true,
  size = 'md',
  colorTheme = 'cyan',
  className,
}: HolographicProgressProps) {
  const theme = getTheme(colorTheme);

  const heightClasses: Record<string, string> = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('relative', className)}>
      {/* Background track */}
      <div
        className={cn('w-full overflow-hidden rounded-full', heightClasses[size])}
        style={{
          background: theme.background,
          border: `1px solid ${theme.secondary}40`,
          boxShadow: `inset 0 0 10px ${theme.glow}20`,
        }}
      >
        {/* Progress fill */}
        <motion.div
          className="relative h-full overflow-hidden rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={tweens.smooth}
          style={{
            background: `linear-gradient(90deg, ${theme.secondary}, ${theme.primary})`,
            boxShadow: `0 0 15px ${theme.glow}`,
          }}
        >
          {/* Animated shine */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent}80, transparent)`,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={loop(tweens.ambient)}
          />
        </motion.div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="mt-1 text-right text-sm" style={{ color: theme.primary }}>
          {clampedValue.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

export default HolographicProgress;
