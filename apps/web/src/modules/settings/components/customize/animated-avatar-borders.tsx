/**
 * Animated Avatar Border Effects
 *
 * Orchestrator that delegates to specialised border-effect modules.
 * Each effect category lives in its own file to keep line counts low.
 *
 * @version 2.0.0
 */

import type { ReactNode } from 'react';
import type { BorderEffectParams } from '@/modules/settings/components/customize/border-effect-types';
import {
  renderStaticBorder,
  renderReducedMotionFallback,
  renderGlowBorder,
  renderPulseBorder,
  renderRotateBorder,
} from '@/modules/settings/components/customize/border-effects-simple';
import {
  renderFireBorder,
  renderIceBorder,
  renderElectricBorder,
} from '@/modules/settings/components/customize/border-effects-elemental';
import {
  renderLegendaryBorder,
  renderMythicBorder,
} from '@/modules/settings/components/customize/border-effects-legendary';

export type { BorderEffectParams } from '@/modules/settings/components/customize/border-effect-types';

/**
 * unknown for the settings module.
 */
/**
 * Renders border effect.
 *
 * @param params - The params.
 * @returns The result.
 */
export function renderBorderEffect(params: BorderEffectParams): ReactNode {
  const { borderType, colors, borderWidth, prefersReducedMotion } = params;

  if (prefersReducedMotion) {
    return borderType === 'none' ? null : renderReducedMotionFallback(colors, borderWidth);
  }

  switch (borderType) {
    case 'none':
      return null;
    case 'static':
      return renderStaticBorder(colors, borderWidth);
    case 'glow':
      return renderGlowBorder(params);
    case 'pulse':
      return renderPulseBorder(params);
    case 'rotate':
      return renderRotateBorder(params);
    case 'fire':
      return renderFireBorder(params);
    case 'ice':
      return renderIceBorder(params);
    case 'electric':
      return renderElectricBorder(params);
    case 'legendary':
      return renderLegendaryBorder(params);
    case 'mythic':
      return renderMythicBorder(params);
    case 'lottie':
      // Lottie borders are handled directly by AnimatedAvatar via LottieBorderRenderer
      // This case exists only as a type-safe fallback
      return null;
    default:
      return null;
  }
}
