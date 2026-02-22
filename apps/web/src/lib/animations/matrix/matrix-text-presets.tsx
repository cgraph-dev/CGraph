/**
 * Matrix Text preset variants
 * @module lib/animations/matrix
 */

import { memo } from 'react';
import { MatrixText } from './matrix-text';
import type { MatrixTextProps } from './matrix-text.utils';

// =============================================================================
// PRESET VARIANTS
// =============================================================================

/**
 * Logo text with Matrix decryption effect - Enhanced with continuous cipher morph
 */
export const MatrixLogo = memo(function MatrixLogo({
  text = 'CGraph',
  className = 'text-4xl font-bold text-green-400',
  ...props
}: Partial<MatrixTextProps>) {
  return (
    <MatrixText
      text={text}
      className={className}
      animationDuration={2000}
      startDelay={300}
      loop
      loopDelay={4000}
      direction="both"
      charset="katakana"
      enableGlow
      glowColor="#39ff14"
      {...props}
    />
  );
});

/**
 * Subtle text encryption for headings with ambient morph
 */
export const MatrixHeading = memo(function MatrixHeading({
  text,
  className = 'text-2xl font-semibold text-green-300',
  ...props
}: MatrixTextProps) {
  return (
    <MatrixText
      text={text}
      className={className}
      animationDuration={1200}
      startDelay={100}
      loop={false}
      direction="decrypt"
      charset="mixed"
      enableGlow
      glowColor="#00ff41"
      {...props}
    />
  );
});

/**
 * Continuous cipher text - never settles, always morphing
 */
export const MatrixCipherText = memo(function MatrixCipherText({
  text,
  className = 'text-lg font-mono text-green-400',
  ...props
}: MatrixTextProps) {
  return (
    <MatrixText
      text={text}
      className={className}
      animationDuration={1500}
      startDelay={0}
      loop
      loopDelay={2000}
      direction="both"
      charset="katakana"
      enableGlow
      glowColor="#00ff41"
      {...props}
    />
  );
});
