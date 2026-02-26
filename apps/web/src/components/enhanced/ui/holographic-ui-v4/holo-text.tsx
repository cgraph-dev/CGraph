/**
 * HoloText Component
 * @version 4.0.0
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface HoloTextProps {
  children: ReactNode;
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  preset?: HoloPreset;
  animate?: boolean;
  glowIntensity?: number;
  gradient?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Text component.
 */
export function HoloText({
  children,
  variant = 'body',
  preset = 'cyan',
  animate = true,
  glowIntensity = 1,
  gradient = false,
  className,
  as: Component = 'span',
}: HoloTextProps) {
  const theme = getTheme(preset);

  const variantStyles: Record<string, string> = {
    display: 'text-5xl font-black tracking-tight',
    title: 'text-3xl font-bold tracking-wide',
    subtitle: 'text-xl font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    label: 'text-xs uppercase tracking-widest font-medium',
  };

  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      className={cn(variantStyles[variant], className)}
      style={{
        color: gradient ? 'transparent' : theme.text,
        backgroundClip: gradient ? 'text' : undefined,
        WebkitBackgroundClip: gradient ? 'text' : undefined,
        background: gradient
          ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
          : undefined,
        textShadow: gradient
          ? undefined
          : `
            0 0 ${4 * glowIntensity}px ${theme.glow},
            0 0 ${8 * glowIntensity}px ${theme.glow}60
          `,
      }}
      animate={
        animate
          ? {
              textShadow: [
                `0 0 ${4 * glowIntensity}px ${theme.glow}, 0 0 ${8 * glowIntensity}px ${theme.glow}60`,
                `0 0 ${6 * glowIntensity}px ${theme.glow}, 0 0 ${12 * glowIntensity}px ${theme.glow}80`,
                `0 0 ${4 * glowIntensity}px ${theme.glow}, 0 0 ${8 * glowIntensity}px ${theme.glow}60`,
              ],
            }
          : undefined
      }
      transition={loop(tweens.ambientSlow)}
    >
      {children}
    </MotionComponent>
  );
}
