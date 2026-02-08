/**
 * Shared types for animated avatar border effects.
 */

import type { ReactNode } from 'react';
import type { AvatarBorderType } from '@/modules/settings/store/customization';

export interface BorderEffectParams {
  borderType: AvatarBorderType;
  colors: { primary: string; secondary: string; glow: string };
  borderWidth: number;
  avatarSize: number;
  speedMultiplier: number;
  gpuStyles: React.CSSProperties;
  prefersReducedMotion: boolean;
}

/** Render function signature shared by all border-effect modules. */
export type BorderEffectRenderer = (params: BorderEffectParams) => ReactNode;
