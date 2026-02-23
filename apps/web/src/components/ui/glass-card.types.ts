/**
 * Glass card type definitions.
 * @module
 */
import { ReactNode, HTMLAttributes } from 'react';

export interface GlassCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'children'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
> {
  children: ReactNode;
  variant?: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'aurora';
  intensity?: 'subtle' | 'medium' | 'strong';
  glow?: boolean;
  glowColor?: string;
  hover3D?: boolean;
  shimmer?: boolean;
  borderGradient?: boolean;
  particles?: boolean;
  className?: string;
}
