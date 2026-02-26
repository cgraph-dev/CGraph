/**
 * Elemental border effects: fire, ice, electric.
 */

import { durations } from '@cgraph/animation-constants';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { BorderEffectParams } from '@/modules/settings/components/customize/border-effect-types';

/**
 * unknown for the settings module.
 */
/**
 * Renders fire border.
 */
export function renderFireBorder({
  colors,
  borderWidth,
  avatarSize,
  speedMultiplier,
  gpuStyles,
}: BorderEffectParams): ReactNode {
  return (
    <>
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `${borderWidth}px solid ${colors.primary}` }}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            ...gpuStyles,
            width: 6,
            height: 12,
            background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transformOrigin: `0 ${avatarSize / 2 + 4}px`,
            rotate: `${i * 30}deg`,
          }}
          animate={{ scaleY: [0.5, 1.2, 0.5], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: durations.smooth.ms / 1000 * speedMultiplier, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </>
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders ice border.
 */
export function renderIceBorder({
  colors,
  borderWidth,
  avatarSize,
  speedMultiplier,
}: BorderEffectParams): ReactNode {
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${borderWidth}px solid ${colors.primary}`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2"
          style={{ background: colors.secondary, borderRadius: '2px', left: '50%', top: '50%' }}
          animate={{
            x: [0, Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
            y: [0, Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{ duration: durations.loop.ms / 1000 * speedMultiplier, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Renders electric border.
 */
export function renderElectricBorder({
  colors,
  borderWidth,
  avatarSize,
  speedMultiplier,
}: BorderEffectParams): ReactNode {
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `${borderWidth}px solid ${colors.primary}` }}
        animate={{
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
        }}
        transition={{ duration: durations.fast.ms / 1000 * speedMultiplier, repeat: Infinity, repeatDelay: 0.5 }}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.svg
          key={i}
          className="absolute"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          style={{
            left: '50%',
            top: '50%',
            transform: `rotate(${i * 60}deg) translateY(-${avatarSize / 2 + 8}px)`,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{
            duration: durations.slow.ms / 1000 * speedMultiplier,
            repeat: Infinity,
            repeatDelay: 1 + Math.random(),
            delay: i * 0.2,
          }}
        >
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill={colors.primary} />
        </motion.svg>
      ))}
    </>
  );
}
