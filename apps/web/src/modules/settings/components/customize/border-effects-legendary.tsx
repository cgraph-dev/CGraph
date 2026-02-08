/**
 * Legendary & Mythic border effects.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { BorderEffectParams } from '@/modules/settings/components/customize/border-effect-types';

export function renderLegendaryBorder({
  colors,
  borderWidth,
  avatarSize,
  speedMultiplier,
}: BorderEffectParams): ReactNode {
  return (
    <>
      {/* Inner glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, transparent 60%, ${colors.glow} 100%)` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
      />
      {/* Rotating outer ring */}
      <motion.div
        className="absolute inset-[-6px] rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, #fff, ${colors.primary})`,
          padding: borderWidth + 2,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-full w-full rounded-full bg-gray-900" />
      </motion.div>
      {/* Particle ring */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{
            background: i % 2 === 0 ? colors.primary : colors.secondary,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 6px ${colors.glow}`,
          }}
          animate={{
            x: Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
            y: Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 1 * speedMultiplier, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </>
  );
}

export function renderMythicBorder({
  colors,
  borderWidth,
  avatarSize,
  speedMultiplier,
}: BorderEffectParams): ReactNode {
  return (
    <>
      {/* Void background */}
      <motion.div
        className="absolute inset-[-8px] rounded-full"
        style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3 * speedMultiplier, repeat: Infinity }}
      />
      {/* Multi-layer rotating rings */}
      <motion.div
        className="absolute inset-[-6px] rounded-full opacity-60"
        style={{
          background: `conic-gradient(from 0deg, ${colors.primary}, transparent, ${colors.secondary}, transparent, ${colors.primary})`,
          padding: borderWidth,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-full w-full rounded-full bg-gray-900" />
      </motion.div>
      <motion.div
        className="absolute inset-[-4px] rounded-full"
        style={{
          background: `conic-gradient(from 180deg, ${colors.secondary}, transparent, ${colors.primary}, transparent, ${colors.secondary})`,
          padding: borderWidth,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-full w-full rounded-full bg-gray-900" />
      </motion.div>
      {/* Orbiting particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full"
          style={{
            background: i % 3 === 0 ? '#fff' : i % 3 === 1 ? colors.primary : colors.secondary,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
          animate={{
            x: [
              Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
              Math.cos(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
              Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
            ],
            y: [
              Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
              Math.sin(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
              Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
            ],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 4 * speedMultiplier, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </>
  );
}
