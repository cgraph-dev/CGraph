/**
 * Preset wrapper components for AvatarBorderRenderer
 */

import { memo } from 'react';
import type { AvatarBorderConfig } from '@/types/avatar-borders';
import { AvatarBorderRenderer, type AvatarBorderRendererProps } from './AvatarBorderRenderer';

/** Simple border with just a colored ring */
export const SimpleBorderAvatar = memo(function SimpleBorderAvatar({
  src,
  size = 80,
  color = '#22c55e',
  ...props
}: Omit<AvatarBorderRendererProps, 'border'> & { color?: string }) {
  const border: AvatarBorderConfig = {
    id: 'simple-custom',
    type: 'static',
    name: 'Simple',
    description: 'Simple colored border',
    theme: 'minimal',
    rarity: 'free',
    unlockType: 'default',
    isPremium: false,
    primaryColor: color,
    secondaryColor: color,
    accentColor: color,
    tags: ['custom'],
  };

  return (
    <AvatarBorderRenderer src={src} size={size} border={border} showParticles={false} {...props} />
  );
});

/** Animated glow border */
export const GlowBorderAvatar = memo(function GlowBorderAvatar({
  src,
  size = 80,
  color = '#22c55e',
  ...props
}: Omit<AvatarBorderRendererProps, 'border'> & { color?: string }) {
  const border: AvatarBorderConfig = {
    id: 'glow-custom',
    type: 'simple-glow',
    name: 'Glow',
    description: 'Glowing animated border',
    theme: 'minimal',
    rarity: 'free',
    unlockType: 'default',
    isPremium: false,
    primaryColor: color,
    secondaryColor: color,
    accentColor: color,
    animationSpeed: 'normal',
    tags: ['custom', 'glow'],
  };

  return (
    <AvatarBorderRenderer src={src} size={size} border={border} showParticles={false} {...props} />
  );
});
