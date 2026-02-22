import { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedAvatar } from '../AnimatedAvatar';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
} from '@/modules/settings/store/customization';

export const ProfileCardPreviewLarge = memo(function ProfileCardPreviewLarge() {
  const {
    avatarBorderType,
    avatarBorderColor,
    avatarSize,
    themePreset,
    profileCardStyle,
    showBadges,
    showBio,
    showStatus,
    glowEffects,
    particleEffects,
  } = useCustomizationStore();

  const colors = themeColors[themePreset];

  const getCardStyles = () => {
    switch (profileCardStyle) {
      case 'minimal':
        return {
          bg: 'bg-transparent',
          border: 'border-none',
          padding: 'p-4',
        };
      case 'card':
        return {
          bg: 'bg-gradient-to-br from-white/10 to-white/5',
          border: 'border border-white/20',
          padding: 'p-6',
        };
      case 'full':
        return {
          bg: 'bg-gradient-to-br from-black/40 to-black/20',
          border: 'border border-white/10',
          padding: 'p-6',
        };
      case 'compact':
        return {
          bg: 'bg-white/5',
          border: 'border border-white/10',
          padding: 'p-3',
        };
      case 'premium':
        return {
          bg: `bg-gradient-to-br from-${themePreset}-500/20 to-transparent`,
          border: 'border border-amber-500/30',
          padding: 'p-6',
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border border-white/10',
          padding: 'p-5',
        };
    }
  };

  const cardStyles = getCardStyles();

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${cardStyles.bg} ${cardStyles.border} ${cardStyles.padding}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        boxShadow: glowEffects
          ? `0 0 40px ${colors.glow}30, 0 10px 40px rgba(0, 0, 0, 0.3)`
          : '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Particle effects overlay */}
      {particleEffects && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Profile content */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Avatar */}
        <AnimatedAvatar
          src="/avatars/default-avatar.png"
          size={avatarSize}
          borderType={avatarBorderType}
          borderColor={avatarBorderColor}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">CryptoKing</h3>
            {showStatus && (
              <span className="flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full opacity-75"
                  style={{ background: colors.primary }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: colors.primary }}
                />
              </span>
            )}
          </div>

          {showBadges && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: `${colors.primary}30`,
                  color: colors.primary,
                }}
              >
                ⭐ Elite
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/30 px-2 py-0.5 text-xs font-medium text-purple-300">
                🎮 Gamer
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-300">
                👑 VIP
              </span>
            </div>
          )}

          {showBio && (
            <p className="mt-2 line-clamp-2 text-sm text-white/60">
              Blockchain enthusiast & NFT collector. Building the future of digital ownership.
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="relative z-10 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'XP', value: '12,450' },
          { label: 'Level', value: '47' },
          { label: 'Rank', value: '#142' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/5 px-3 py-2 text-center">
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
