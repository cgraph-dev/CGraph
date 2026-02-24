/**
 * Holographic-styled text component.
 * @module
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTheme } from './constants';
import type { HolographicTextProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * HolographicText Component
 *
 * Glowing text with animated shadow effects
 */
export function HolographicText({
  children,
  variant = 'body',
  colorTheme = 'cyan',
  animate = true,
  glowIntensity = 1,
  className,
}: HolographicTextProps) {
  const theme = getTheme(colorTheme);

  const sizeClasses: Record<string, string> = {
    title: 'text-4xl font-bold tracking-wider',
    subtitle: 'text-2xl font-semibold tracking-wide',
    body: 'text-base',
    label: 'text-sm uppercase tracking-widest',
  };

  return (
    <motion.span
      className={cn(sizeClasses[variant], className)}
      style={{
        color: theme.primary,
        textShadow: `
          0 0 ${5 * glowIntensity}px ${theme.glow},
          0 0 ${10 * glowIntensity}px ${theme.glow},
          0 0 ${20 * glowIntensity}px ${theme.glow}
        `,
      }}
      animate={
        animate
          ? {
              textShadow: [
                `0 0 ${5 * glowIntensity}px ${theme.glow}, 0 0 ${10 * glowIntensity}px ${theme.glow}`,
                `0 0 ${8 * glowIntensity}px ${theme.glow}, 0 0 ${15 * glowIntensity}px ${theme.glow}`,
                `0 0 ${5 * glowIntensity}px ${theme.glow}, 0 0 ${10 * glowIntensity}px ${theme.glow}`,
              ],
            }
          : undefined
      }
      transition={loop(tweens.ambient)}
    >
      {children}
    </motion.span>
  );
}

export default HolographicText;
