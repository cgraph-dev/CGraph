/**
 * Profile Panel
 *
 * Customization panel for profile cards, badges, bio, and status display.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ToggleRow, SectionHeader, OptionButton, PremiumBadge } from '../CustomizationUI';
import { AnimatedAvatar } from '../AnimatedAvatar';
import {
  useCustomizationStoreV2,
  themeColors,
  type ProfileCardStyle,
} from '@/stores/customizationStoreV2';

// =============================================================================
// PROFILE CARD STYLE OPTIONS
// =============================================================================

const profileStyles: { id: ProfileCardStyle; name: string; icon: string; premium?: boolean }[] = [
  { id: 'default', name: 'Default', icon: '📋' },
  { id: 'minimal', name: 'Minimal', icon: '✨' },
  { id: 'card', name: 'Card', icon: '🎴' },
  { id: 'full', name: 'Full Width', icon: '📐' },
  { id: 'compact', name: 'Compact', icon: '📦' },
  { id: 'premium', name: 'Premium', icon: '👑', premium: true },
];

// =============================================================================
// PROFILE CARD PREVIEW
// =============================================================================

const ProfileCardPreviewLarge = memo(function ProfileCardPreviewLarge() {
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
  } = useCustomizationStoreV2();

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

// =============================================================================
// PROFILE PANEL COMPONENT
// =============================================================================

export const ProfilePanel = memo(function ProfilePanel() {
  const {
    profileCardStyle,
    showBadges,
    showBio,
    showStatus,
    themePreset,
    setProfileCardStyle,
    toggleBadges,
    toggleBio,
    toggleStatus,
  } = useCustomizationStoreV2();

  return (
    <div className="space-y-8">
      {/* Live Profile Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="See how your profile card looks"
          icon={<span className="text-lg">👤</span>}
        />
        <ProfileCardPreviewLarge />
      </section>

      {/* Card Style */}
      <section>
        <SectionHeader
          title="Card Style"
          subtitle="Choose how your profile is displayed"
          icon={<span className="text-lg">🎨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profileStyles.map((style) => (
            <div key={style.id} className="relative">
              <OptionButton
                selected={profileCardStyle === style.id}
                onClick={() => setProfileCardStyle(style.id)}
                icon={<span className="text-xl">{style.icon}</span>}
                label={style.name}
                colorPreset={themePreset}
              />
              {style.premium && <PremiumBadge className="absolute -right-2 -top-2" />}
            </div>
          ))}
        </div>
      </section>

      {/* Display Options */}
      <section>
        <SectionHeader
          title="Display Options"
          subtitle="Control what's visible on your profile"
          icon={<span className="text-lg">👁️</span>}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ToggleRow
            label="Show Badges"
            description="Display earned achievement badges"
            icon="🏅"
            enabled={showBadges}
            onToggle={toggleBadges}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Show Bio"
            description="Display your profile biography"
            icon="📝"
            enabled={showBio}
            onToggle={toggleBio}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Show Status"
            description="Display online/offline status"
            icon="🟢"
            enabled={showStatus}
            onToggle={toggleStatus}
            colorPreset={themePreset}
          />
        </div>
      </section>

      {/* Theme Connection */}
      <section>
        <SectionHeader
          title="Theme Connection"
          subtitle="Your profile inherits the active theme"
          icon={<span className="text-lg">🔗</span>}
        />
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${themeColors[themePreset].primary}, ${themeColors[themePreset].secondary})`,
              }}
            />
            <div>
              <h4 className="font-medium capitalize text-white">{themePreset} Theme</h4>
              <p className="text-sm text-white/50">Profile colors match your selected theme</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-white/40">
            💡 Tip: Change your theme in the Theme tab to update profile colors
          </p>
        </div>
      </section>

      {/* Pro Tips */}
      <section className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-medium text-amber-300">Pro Tips</h4>
            <ul className="mt-2 space-y-1 text-sm text-white/60">
              <li>• Premium card style unlocks exclusive animations</li>
              <li>• Combine animated borders with glow effects for maximum impact</li>
              <li>• Use the compact style for dense friend lists</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
});

export default ProfilePanel;
