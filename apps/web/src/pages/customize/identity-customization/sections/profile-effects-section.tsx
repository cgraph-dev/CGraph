/**
 * ProfileEffectsSection Component
 *
 * Displays profile effect selection grid with rarity tiers and descriptions.
 * Uses the shared PROFILE_EFFECT_REGISTRY from @cgraph/animation-constants.
 */

import { motion } from 'motion/react';
import {
  PROFILE_EFFECT_REGISTRY,
  type ProfileEffectEntry,
  type ProfileEffectRarity,
} from '@cgraph/animation-constants';
import { GlassCard } from '@/shared/components/ui';

export interface ProfileEffectsSectionProps {
  selectedEffect: string | null;
  onEquip: (effectId: string | null) => void;
}

const RARITY_GRADIENT: Record<ProfileEffectRarity, string> = {
  free: 'from-gray-500 to-gray-600',
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-500',
  mythic: 'from-pink-500 to-rose-500',
};

const RARITY_COLOR: Record<ProfileEffectRarity, string> = {
  free: '#9ca3af',
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f97316',
  mythic: '#ec4899',
};

const RARITY_LABELS: Record<ProfileEffectRarity, string> = {
  free: 'Free',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

/**
 * Individual effect card in the grid.
 */
function EffectCard({
  effect,
  isSelected,
  onSelect,
}: {
  effect: ProfileEffectEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button onClick={onSelect} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <GlassCard
        variant={isSelected ? 'neon' : 'frosted'}
        glow={isSelected}
        glowColor={isSelected ? `${RARITY_COLOR[effect.rarity]}60` : undefined}
        className={`relative p-4 text-left ${isSelected ? 'ring-2 ring-primary-400' : ''}`}
      >
        {/* Effect icon/preview */}
        <div
          className={`mb-3 flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br ${RARITY_GRADIENT[effect.rarity]} text-3xl`}
        >
          {effect.lottieFile ? '✨' : '⬜'}
        </div>

        {/* Name */}
        <h4 className="mb-0.5 text-sm font-bold text-white">{effect.name}</h4>
        <p className="mb-2 text-[11px] text-white/50">{effect.description}</p>

        {/* Rarity badge */}
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
          style={{
            color: RARITY_COLOR[effect.rarity],
            backgroundColor: `${RARITY_COLOR[effect.rarity]}20`,
          }}
        >
          {RARITY_LABELS[effect.rarity]}
        </span>

        {/* Equipped checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white"
          >
            ✓
          </motion.div>
        )}
      </GlassCard>
    </motion.button>
  );
}

/**
 * Profile effects selection section.
 */
export function ProfileEffectsSection({ selectedEffect, onEquip }: ProfileEffectsSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Choose an animated overlay for your profile card. Showing {PROFILE_EFFECT_REGISTRY.length}{' '}
        effects.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {PROFILE_EFFECT_REGISTRY.map((effect, index) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <EffectCard
              effect={effect}
              isSelected={
                selectedEffect === effect.id || (!selectedEffect && effect.id === 'effect_none')
              }
              onSelect={() => onEquip(effect.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
