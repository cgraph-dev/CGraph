/**
 * AvatarPreview Component
 *
 * Preview panel showing the avatar with current customization settings.
 *
 * @module components/landing/CustomizationDemo/AvatarPreview
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState, AvatarBorderType } from './types';
import { themeColors } from './constants';
import { AnimatedAvatar } from './AnimatedAvatar';
import { getBorderById } from '@/data/avatar-borders';

interface AvatarPreviewProps {
  state: DemoState;
  onChange?: (updates: Partial<DemoState>) => void;
}

// Valid avatar border types for the AnimatedAvatar component
const VALID_BORDER_TYPES: AvatarBorderType[] = [
  'none',
  'static',
  'glow',
  'pulse',
  'rotate',
  'fire',
  'ice',
  'electric',
  'legendary',
  'mythic',
];

export const AvatarPreview = memo(function AvatarPreview({ state }: AvatarPreviewProps) {
  const colors = themeColors[state.theme];
  const speedMultiplier =
    state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  // Get selected themed border if one is selected
  const selectedBorder = state.selectedBorderId ? getBorderById(state.selectedBorderId) : null;

  // Use themed border type if available and valid, otherwise fall back to default
  const rawBorderType = selectedBorder?.type || state.avatarBorder;
  const avatarBorderType: AvatarBorderType = VALID_BORDER_TYPES.includes(
    rawBorderType as AvatarBorderType
  )
    ? (rawBorderType as AvatarBorderType)
    : 'legendary';

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8"
      style={{
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
      }}
      animate={
        state.glowEnabled
          ? {
              boxShadow: [
                `0 0 30px ${colors.glow}`,
                `0 0 50px ${colors.glow}`,
                `0 0 30px ${colors.glow}`,
              ],
            }
          : {}
      }
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {state.particlesEnabled && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Avatar */}
        <AnimatedAvatar
          borderType={avatarBorderType}
          borderColor={state.avatarBorderColor}
          size={state.avatarSize}
          speedMultiplier={speedMultiplier}
        />

        {/* User info */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-white">CGraph User</h3>
          <p className="text-sm text-gray-400">Level 42 • Legendary</p>
        </div>

        {/* Badges preview */}
        <div className="flex gap-2">
          {['🛡️', '⚔️', '🎩', '👑'].map((emoji, i) => (
            <motion.div
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-lg"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={{ scale: 1.1 }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-lg font-bold text-white">1.2k</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">847</div>
            <div className="text-xs text-gray-500">Friends</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: colors.primary }}>
              +2.4k
            </div>
            <div className="text-xs text-gray-500">Karma</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
