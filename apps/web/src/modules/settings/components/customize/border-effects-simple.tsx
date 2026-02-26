/**
 * Simple border effects: none, static, glow, pulse, rotate.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { BorderEffectParams } from '@/modules/settings/components/customize/border-effect-types';

/**
 * unknown for the settings module.
 */
/**
 * Renders static border.
 *
 * @param colors - The colors.
 * @param borderWidth - The border width.
 */
export function renderStaticBorder(
  colors: BorderEffectParams['colors'],
  borderWidth: number
): ReactNode {
  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{ border: `${borderWidth}px solid ${colors.primary}` }}
    />
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders reduced motion fallback.
 *
 * @param colors - The colors.
 * @param borderWidth - The border width.
 */
export function renderReducedMotionFallback(
  colors: BorderEffectParams['colors'],
  borderWidth: number
): ReactNode {
  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{
        border: `${borderWidth}px solid ${colors.primary}`,
        boxShadow: `0 0 15px ${colors.glow}`,
      }}
    />
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders glow border.
 */
export function renderGlowBorder({
  colors,
  borderWidth,
  speedMultiplier,
  gpuStyles,
}: BorderEffectParams): ReactNode {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        ...gpuStyles,
        border: `${borderWidth}px solid ${colors.primary}`,
        boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
      }}
      animate={{
        boxShadow: [
          `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
          `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}`,
          `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
        ],
      }}
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    />
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders pulse border.
 */
export function renderPulseBorder({
  colors,
  borderWidth,
  speedMultiplier,
  gpuStyles,
}: BorderEffectParams): ReactNode {
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ ...gpuStyles, border: `${borderWidth}px solid ${colors.primary}` }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ ...gpuStyles, border: `${borderWidth}px solid ${colors.primary}` }}
        animate={{ scale: [1, 1.3, 1.3], opacity: [0.8, 0, 0] }}
        transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ ...gpuStyles, border: `${borderWidth}px solid ${colors.secondary}` }}
        animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
        transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity, delay: 0.3 }}
      />
    </>
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders rotate border.
 */
export function renderRotateBorder({
  colors,
  borderWidth,
  speedMultiplier,
  gpuStyles,
}: BorderEffectParams): ReactNode {
  return (
    <motion.div
      className="absolute inset-[-4px] rounded-full"
      style={{
        ...gpuStyles,
        background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, ${colors.primary})`,
        padding: borderWidth,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 3 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
    >
      <div className="h-full w-full rounded-full bg-gray-900" />
    </motion.div>
  );
}
