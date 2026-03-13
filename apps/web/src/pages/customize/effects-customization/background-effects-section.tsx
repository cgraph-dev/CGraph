/**
 * Background effects section — 3-state toggle (none / static / animated)
 * @module pages/customize/effects-customization
 */

import { motion } from 'motion/react';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { BackgroundEffect } from './types';

// =============================================================================
// BACKGROUND EFFECTS SECTION — 3-STATE TOGGLE
// =============================================================================

interface BackgroundEffectsSectionProps {
  backgrounds: BackgroundEffect[];
  selectedBackground: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/**
 * Background Effects 3-state toggle section.
 * @description Renders none / static / animated background effect options.
 */
export function BackgroundEffectsSection({
  backgrounds,
  selectedBackground,
  onSelect,
}: BackgroundEffectsSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Choose your background effect style</p>
      <div className="grid grid-cols-3 gap-4">
        {backgrounds.map((bg, index) => {
          const isSelected = selectedBackground === bg.id;
          return (
            <motion.button
              key={bg.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(bg.id, bg.unlocked)}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02] ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/30'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Preview */}
              <motion.div
                className="mb-3 h-24 overflow-hidden rounded-lg"
                style={{ background: bg.preview }}
                animate={
                  bg.animated ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}
                }
                transition={bg.animated ? { duration: 10, repeat: Infinity } : {}}
              />

              {/* Label */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{bg.name}</h4>
                  <p className="text-xs text-white/50">{bg.description}</p>
                </div>
                {isSelected && (
                  <CheckCircleIconSolid className="h-5 w-5 flex-shrink-0 text-primary-400" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
