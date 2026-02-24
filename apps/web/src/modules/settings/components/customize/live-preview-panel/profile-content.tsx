/**
 * ProfileContent - Avatar, name, title, status, badges, and XP bar
 */

import { motion } from 'framer-motion';
import { AnimatedAvatar } from '../animated-avatar';
import type {
  AvatarBorderType,
  ThemePreset,
  TitleDisplay,
} from '@/modules/settings/store/customization';
import { springs, tweens, loop } from '@/lib/animation-presets';
import { GlowText, FireText } from '@/shared/components/ui';
import { MOCK_BADGES } from './constants';
import type { ThemeColors } from './types';

interface ProfileContentProps {
  settings: {
    avatarSize: 'small' | 'medium' | 'large' | number;
    glowEnabled: boolean;
    showBadges: boolean;
    showStatus: boolean;
  };
  colors: ThemeColors;
  effectiveBorderType: AvatarBorderType;
  effectiveColorPreset: ThemePreset;
  effectiveTitle: string | null;
  titleInfo: TitleDisplay | null;
  isLegendaryTitle: boolean;
  speedMultiplier: number;
}

export function ProfileContent({
  settings,
  colors,
  effectiveBorderType,
  effectiveColorPreset,
  effectiveTitle,
  titleInfo,
  isLegendaryTitle,
  speedMultiplier,
}: ProfileContentProps) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Avatar */}
      <AnimatedAvatar
        borderType={effectiveBorderType}
        borderColor={effectiveColorPreset}
        size={settings.avatarSize}
        speedMultiplier={speedMultiplier}
      />

      {/* Name & Title & Status */}
      <div className="mt-3 text-center">
        <GlowText
          as="h4"
          gradient={[colors.primary, colors.secondary]}
          size="lg"
          animate={true}
          glowIntensity="medium"
        >
          CryptoNinja
        </GlowText>

        {/* Title Display */}
        {titleInfo && (
          <motion.div
            className="mt-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={effectiveTitle}
          >
            {isLegendaryTitle ? (
              <FireText size="sm">{titleInfo.name}</FireText>
            ) : (
              <span className={`text-xs font-medium ${titleInfo.gradient}`}>{titleInfo.name}</span>
            )}
          </motion.div>
        )}

        {settings.showStatus && (
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <motion.span
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 4px rgba(52, 211, 153, 0.5)',
                  '0 0 8px rgba(52, 211, 153, 0.8)',
                  '0 0 4px rgba(52, 211, 153, 0.5)',
                ],
              }}
              transition={loop(tweens.ambient)}
            />
            <span className="text-xs text-emerald-400">Online</span>
          </div>
        )}
      </div>

      {/* Badges */}
      {settings.showBadges && (
        <div className="mt-3 flex gap-2">
          {MOCK_BADGES.map((badge, i) => (
            <motion.div
              key={i}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sm"
              style={{
                background: `${badge.color}30`,
                boxShadow: settings.glowEnabled ? `0 0 10px ${badge.color}50` : 'none',
              }}
              animate={
                settings.glowEnabled
                  ? {
                      boxShadow: [
                        `0 0 10px ${badge.color}50`,
                        `0 0 20px ${badge.color}70`,
                        `0 0 10px ${badge.color}50`,
                      ],
                    }
                  : undefined
              }
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{
                ...springs.bouncy,
                duration: 2,
                repeat: settings.glowEnabled ? Infinity : 0,
                delay: i * 0.3,
              }}
            >
              <motion.div
                className="absolute -inset-1 rounded-lg opacity-50"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${badge.color}, transparent)`,
                }}
                animate={{ rotate: 360 }}
                transition={loop(tweens.glacial)}
              />
              <span className="relative z-10">{badge.emoji}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* XP Bar */}
      <div className="mt-4 w-full">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 0 12px ${colors.primary}40`,
              }}
              animate={{
                boxShadow: [
                  `0 0 8px ${colors.primary}40`,
                  `0 0 16px ${colors.primary}60`,
                  `0 0 8px ${colors.primary}40`,
                ],
              }}
              transition={loop(tweens.ambient)}
            >
              42
            </motion.div>
            <span className="text-xs font-medium text-white/80">Level</span>
          </div>
          <span className="text-xs text-white/60">7,842 / 10,000 XP</span>
        </div>

        {/* XP Progress Bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 6px)`,
            }}
          />

          <motion.div
            className="relative h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 0 10px ${colors.primary}60, inset 0 1px 0 rgba(255,255,255,0.3)`,
              width: '78%',
            }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...tweens.slow, duration: 1.2, delay: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={loopWithDelay(tweens.ambient, 3)}
            />
          </motion.div>

          <motion.div
            className="absolute top-0 h-full w-1 rounded-full blur-sm"
            style={{
              left: '78%',
              background: colors.secondary,
              boxShadow: `0 0 8px ${colors.secondary}`,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={loop(tweens.verySlow)}
          />
        </div>

        <div className="mt-1 flex justify-end">
          <span className="text-[10px] text-white/40">2,158 XP to Level 43</span>
        </div>
      </div>
    </div>
  );
}
