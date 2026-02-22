/**
 * Avatar Panel
 *
 * Customization panel for avatar borders, colors, and sizes.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedAvatar } from '../animated-avatar';
import { ColorPickerGrid, SizeSelector, SectionHeader, OptionButton } from '../customization-ui';
import {
  useCustomizationStore,
  AVATAR_BORDERS as avatarBorders,
  type AvatarBorderType,
} from '@/modules/settings/store/customization';

// =============================================================================
// BORDER TYPE OPTIONS
// =============================================================================

const borderOptions: { id: AvatarBorderType; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '⭕' },
  { id: 'static', name: 'Static', icon: '🔘' },
  { id: 'glow', name: 'Glow', icon: '💫' },
  { id: 'pulse', name: 'Pulse', icon: '💓' },
  { id: 'rotate', name: 'Orbit', icon: '🔄' },
  { id: 'fire', name: 'Inferno', icon: '🔥' },
  { id: 'ice', name: 'Frost', icon: '❄️' },
  { id: 'electric', name: 'Storm', icon: '⚡' },
  { id: 'legendary', name: 'Legendary', icon: '⭐' },
  { id: 'mythic', name: 'Mythic', icon: '🌌' },
];

// =============================================================================
// AVATAR PANEL COMPONENT
// =============================================================================

export const AvatarPanel = memo(function AvatarPanel() {
  const {
    avatarBorderType,
    avatarBorderColor,
    avatarSize,
    animationSpeed,
    setAvatarBorder,
    setAvatarBorderColor,
    setAvatarSize,
    themePreset,
  } = useCustomizationStore();

  const speedMultiplier = animationSpeed === 'slow' ? 2 : animationSpeed === 'fast' ? 0.5 : 1;

  return (
    <div className="space-y-8">
      {/* Live Avatar Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="See your avatar in all sizes"
          icon={<span className="text-lg">👤</span>}
        />
        <div className="flex items-end justify-center gap-6 rounded-xl border border-white/10 bg-black/20 p-6">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <motion.div
              key={size}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: size === 'small' ? 0 : size === 'medium' ? 0.1 : 0.2 }}
            >
              <AnimatedAvatar
                borderType={avatarBorderType}
                borderColor={avatarBorderColor}
                size={size}
                speedMultiplier={speedMultiplier}
              />
              <span className="text-xs capitalize text-white/50">{size}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Border Type Selection */}
      <section>
        <SectionHeader
          title="Border Type"
          subtitle="Select your avatar border effect"
          icon={<span className="text-lg">🎭</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {borderOptions.map((border) => {
            const config = avatarBorders[border.id];
            return (
              <OptionButton
                key={border.id}
                selected={avatarBorderType === border.id}
                onClick={() => setAvatarBorder(border.id)}
                icon={<span className="text-xl">{border.icon}</span>}
                label={border.name}
                description={config.description}
                premium={config.premium}
                rarity={config.rarity}
                colorPreset={themePreset}
              />
            );
          })}
        </div>
      </section>

      {/* Border Color */}
      <section>
        <SectionHeader
          title="Border Color"
          subtitle="Choose your border color theme"
          icon={<span className="text-lg">🎨</span>}
        />
        <ColorPickerGrid selected={avatarBorderColor} onSelect={setAvatarBorderColor} size="lg" />
      </section>

      {/* Avatar Size */}
      <section>
        <SectionHeader
          title="Default Size"
          subtitle="Set your preferred avatar size"
          icon={<span className="text-lg">📐</span>}
        />
        <div className="flex items-center gap-4">
          <SizeSelector value={avatarSize} onChange={setAvatarSize} colorPreset={themePreset} />
          <span className="text-sm text-white/50">
            {avatarSize === 'small' ? '48px' : avatarSize === 'medium' ? '64px' : '80px'}
          </span>
        </div>
      </section>

      {/* Premium Upsell */}
      <motion.div
        className="rounded-xl border border-purple-500/30 p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">👑</span>
          <div className="flex-1">
            <h4 className="font-semibold text-white">Unlock Premium Borders</h4>
            <p className="mt-1 text-xs text-white/60">
              Get access to Legendary, Mythic, and themed border collections with CGraph Premium.
            </p>
            <button className="mt-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105">
              Upgrade Now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default AvatarPanel;
