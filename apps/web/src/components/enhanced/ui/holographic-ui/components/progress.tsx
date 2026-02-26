/**
 * HoloProgress Component
 * @module components/enhanced/ui/holographic-ui/components/progress
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HoloProgressProps } from '../types';
import { getTheme } from '../presets';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Progress component.
 */
export function HoloProgress({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  preset = 'cyan',
  animated = true,
  variant = 'linear',
  className,
}: HoloProgressProps) {
  const theme = getTheme(preset);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 45;
    const stroke = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg width={(radius + stroke) * 2} height={(radius + stroke) * 2} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={theme.surface}
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <motion.circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={theme.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={tweens.emphatic}
            style={{
              filter: `drop-shadow(0 0 4px ${theme.glow})`,
            }}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-sm font-semibold" style={{ color: theme.text }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full', heights[size])}
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        <motion.div
          className="relative h-full overflow-hidden rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={tweens.smooth}
          style={{
            background: `linear-gradient(90deg, ${theme.secondary}, ${theme.primary})`,
            boxShadow: `0 0 12px ${theme.glow}`,
          }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)`,
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={loop(tweens.verySlow)}
            />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-sm" style={{ color: theme.textMuted }}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
