/**
 * Matrix background animation variant components.
 * @module lib/animations/matrix/matrix-background-variants
 */
import { memo } from 'react';
import { MatrixBackground } from './matrix-background';
import type { MatrixBackgroundProps } from './matrix-background.types';

/**
 * Auth page background variant
 * Optimized for login/register pages with subtle effect
 */
export const MatrixAuthBackground = memo(function MatrixAuthBackground(
  props: Omit<MatrixBackgroundProps, 'intensity'> & { opacity?: number }
) {
  const { zIndex = -10, opacity = 0.5, ...rest } = props;

  return (
    <MatrixBackground
      {...rest}
      intensity="low"
      opacity={opacity}
      theme={rest.theme || 'matrix-green'}
      fullscreen
      zIndex={zIndex}
    />
  );
});

/**
 * Hero section background variant
 * High-impact visual for landing pages
 */
export const MatrixHeroBackground = memo(function MatrixHeroBackground(
  props: Omit<MatrixBackgroundProps, 'intensity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="high"
      theme={props.theme || 'cyber-blue'}
      fullscreen={false}
    />
  );
});

/**
 * Ambient background variant
 * Subtle animation for general use
 */
export const MatrixAmbientBackground = memo(function MatrixAmbientBackground(
  props: Omit<MatrixBackgroundProps, 'intensity' | 'opacity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="low"
      opacity={0.2}
      theme={props.theme || 'matrix-green'}
    />
  );
});
