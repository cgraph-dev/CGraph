/**
 * NameplatesSection Component
 *
 * Advanced nameplate selection with category filtering, text effect preview,
 * particle overlays, and Naraka-style emblem/gradient system.
 * Uses the shared NAMEPLATE_REGISTRY from @cgraph/animation-constants.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  NAMEPLATE_REGISTRY,
  NAMEPLATE_CATEGORIES,
  type NameplateEntry,
  type NameplateRarity,
  type NameplateCategory,
} from '@cgraph/animation-constants';
import { GlassCard } from '@/shared/components/ui';
import { NameplateRenderer } from '@/components/ui/nameplate-renderer';

export interface NameplatesSectionProps {
  selectedNameplate: string | null;
  onEquip: (nameplateId: string | null) => void;
}

const RARITY_COLORS: Record<NameplateRarity, string> = {
  free: '#9ca3af',
  common: '#9ca3af',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f97316',
  mythic: '#ec4899',
};

const RARITY_LABELS: Record<NameplateRarity, string> = {
  free: 'Free',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

const CATEGORY_ICONS: Record<string, string> = {
  all: '✨',
  basic: '◻',
  metallic: '⚙',
  nature: '🌿',
  cyberpunk: '⚡',
  elemental: '🔥',
  cosmic: '✧',
  fantasy: '💖',
  dark: '◈',
  divine: '👑',
  mythical: '🐉',
};

/**
 * Single nameplate row with live preview and details.
 */
function NameplateRow({
  plate,
  isSelected,
  onSelect,
}: {
  plate: NameplateEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className={`group relative w-full rounded-xl p-4 text-left transition-all ${
        isSelected ? 'bg-primary-600/20 ring-2 ring-primary-500' : 'bg-white/5 hover:bg-white/10'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-4">
        {/* Live nameplate preview */}
        <div className="flex w-48 shrink-0 items-center justify-center">
          <NameplateRenderer
            nameplate={plate}
            username="CryptoNinja"
            size="md"
            showParticles={true}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{plate.name}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{
                color: RARITY_COLORS[plate.rarity],
                backgroundColor: `${RARITY_COLORS[plate.rarity]}20`,
              }}
            >
              {RARITY_LABELS[plate.rarity]}
            </span>
            {plate.textEffect !== 'none' && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase text-white/60">
                {plate.textEffect}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/50">{plate.description}</p>
          {/* Feature badges */}
          <div className="mt-1 flex flex-wrap gap-1">
            {plate.particleType !== 'none' && (
              <span className="rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/40">
                {plate.particleType} particles
              </span>
            )}
            {plate.emblem && (
              <span className="rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/40">
                {plate.emblem} emblem
              </span>
            )}
            {plate.borderStyle !== 'none' && (
              <span className="rounded bg-white/5 px-1 py-0.5 text-[9px] text-white/40">
                {plate.borderStyle} border
              </span>
            )}
          </div>
        </div>

        {/* Equipped indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs text-white"
          >
            ✓
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Nameplates section with category filtering and advanced previews.
 */
export function NameplatesSection({ selectedNameplate, onEquip }: NameplatesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<NameplateCategory>('all');

  const currentPlate: NameplateEntry | undefined =
    NAMEPLATE_REGISTRY.find((p) => p.id === selectedNameplate) ?? NAMEPLATE_REGISTRY[0];

  const filteredPlates = useMemo(() => {
    if (activeCategory === 'all') return NAMEPLATE_REGISTRY;
    return NAMEPLATE_REGISTRY.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <p className="text-sm text-white/60">
          Choose how your name appears across CGraph — in friend lists, group channels,
          forum posts, and online member panels. Showing {NAMEPLATE_REGISTRY.length} nameplates.
        </p>
      </div>

      {/* Where nameplates show */}
      <div className="flex flex-wrap gap-2">
        {['Friend List', 'Groups', 'Forums', 'Chat', 'Profile Card', 'Online Members'].map(
          (place) => (
            <span
              key={place}
              className="rounded-full bg-primary-500/10 px-2.5 py-1 text-[10px] font-medium text-primary-400"
            >
              {place}
            </span>
          ),
        )}
      </div>

      {/* Multi-context preview */}
      <GlassCard variant="frosted" className="p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Live Preview — How others see you
        </div>
        {currentPlate && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Friend list preview */}
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-white/30">
                Friend List
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500" />
                <div>
                  <NameplateRenderer
                    nameplate={currentPlate}
                    username="CryptoNinja"
                    size="sm"
                  />
                  <span className="text-[10px] text-green-400">● Online</span>
                </div>
              </div>
            </div>

            {/* Group channel preview */}
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-white/30">
                Group Channel
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                <div>
                  <NameplateRenderer
                    nameplate={currentPlate}
                    username="CryptoNinja"
                    size="sm"
                  />
                  <span className="text-[10px] text-white/30">Admin</span>
                </div>
              </div>
            </div>

            {/* Forum post preview */}
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-white/30">
                Forum Post
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
                <div>
                  <NameplateRenderer
                    nameplate={currentPlate}
                    username="CryptoNinja"
                    size="sm"
                  />
                  <span className="text-[10px] text-white/30">Level 42 · 3.2k posts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Category filter */}
      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {NAMEPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
              activeCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mr-1">{CATEGORY_ICONS[cat] ?? '•'}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Nameplate list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredPlates.map((plate, index) => (
            <motion.div
              key={plate.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
            >
              <NameplateRow
                plate={plate}
                isSelected={
                  selectedNameplate === plate.id || (!selectedNameplate && plate.id === 'plate_none')
                }
                onSelect={() => onEquip(plate.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredPlates.length === 0 && (
        <div className="py-8 text-center text-sm text-white/40">
          No nameplates in this category yet.
        </div>
      )}
    </div>
  );
}
