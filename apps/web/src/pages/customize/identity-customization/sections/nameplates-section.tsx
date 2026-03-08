/**
 * NameplatesSection Component
 *
 * Displays nameplate selection grid with rarity filtering and live preview.
 * Uses the shared NAMEPLATE_REGISTRY from @cgraph/animation-constants.
 */

import { motion } from 'motion/react';
import {
  NAMEPLATE_REGISTRY,
  type NameplateEntry,
  type NameplateRarity,
} from '@cgraph/animation-constants';
import { GlassCard } from '@/shared/components/ui';

export interface NameplatesSectionProps {
  selectedNameplate: string | null;
  onEquip: (nameplateId: string | null) => void;
}

const RARITY_COLORS: Record<NameplateRarity, string> = {
  FREE: '#9ca3af',
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#8b5cf6',
  LEGENDARY: '#f97316',
  MYTHICAL: '#ec4899',
};

const RARITY_LABELS: Record<NameplateRarity, string> = {
  FREE: 'Free',
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
  MYTHICAL: 'Mythical',
};

/**
 * Single nameplate row with preview bar and equip action.
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
        {/* Nameplate preview bar */}
        <div
          className="flex h-10 w-40 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            background: plate.lottieFile
              ? `linear-gradient(135deg, ${RARITY_COLORS[plate.rarity]}40, ${RARITY_COLORS[plate.rarity]}10)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${RARITY_COLORS[plate.rarity]}40`,
            color: plate.textColor,
          }}
        >
          CryptoNinja
        </div>

        {/* Info */}
        <div className="flex-1">
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
          </div>
          <p className="mt-0.5 text-xs text-white/50">{plate.description}</p>
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
 * Nameplates section with full registry grid.
 */
export function NameplatesSection({ selectedNameplate, onEquip }: NameplatesSectionProps) {
  const currentPlate: NameplateEntry | undefined =
    NAMEPLATE_REGISTRY.find((p) => p.id === selectedNameplate) ?? NAMEPLATE_REGISTRY[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Choose a decorative bar behind your display name. Showing {NAMEPLATE_REGISTRY.length}{' '}
        nameplates.
      </p>

      {/* Current preview */}
      <GlassCard variant="frosted" className="flex items-center justify-center p-6">
        {currentPlate ? (
          <div className="text-center">
            <div
              className="mx-auto mb-2 flex h-12 w-64 items-center justify-center rounded-lg text-lg font-bold"
              style={{
                background: currentPlate.lottieFile
                  ? `linear-gradient(135deg, ${RARITY_COLORS[currentPlate.rarity]}30, ${RARITY_COLORS[currentPlate.rarity]}10)`
                  : 'transparent',
                border: currentPlate.lottieFile
                  ? `1px solid ${RARITY_COLORS[currentPlate.rarity]}30`
                  : 'none',
                color: currentPlate.textColor,
              }}
            >
              CryptoNinja
            </div>
            <span className="text-xs text-white/40">Equipped: {currentPlate.name}</span>
          </div>
        ) : (
          <span className="text-xs text-white/40">No nameplates available</span>
        )}
      </GlassCard>

      {/* Nameplate list */}
      <div className="space-y-2">
        {NAMEPLATE_REGISTRY.map((plate, index) => (
          <motion.div
            key={plate.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
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
      </div>
    </div>
  );
}
