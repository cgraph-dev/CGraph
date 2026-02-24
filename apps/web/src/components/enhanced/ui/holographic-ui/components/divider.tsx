/**
 * HoloDivider Component
 * @module components/enhanced/ui/holographic-ui/components/divider
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HoloDividerProps } from '../types';
import { getTheme } from '../presets';
import { tweens, loop } from '@/lib/animation-presets';

export function HoloDivider({
  preset = 'cyan',
  orientation = 'horizontal',
  decorative = true,
  className,
}: HoloDividerProps) {
  const theme = getTheme(preset);

  if (orientation === 'vertical') {
    return (
      <div
        className={cn('h-full w-px', className)}
        style={{
          background: `linear-gradient(180deg, transparent, ${theme.border}, transparent)`,
        }}
      />
    );
  }

  return (
    <div className={cn('relative my-4 h-px w-full', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)`,
        }}
      />
      {decorative && (
        <motion.div
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.glow}` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={loop(tweens.ambient)}
        />
      )}
    </div>
  );
}
