/**
 * Background effects section for effects customization
 * @module pages/customize/effects-customization
 */

import { motion } from 'motion/react';
import { LockClosedIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { BackgroundEffect } from './types';

// =============================================================================
// BACKGROUND EFFECTS SECTION
// =============================================================================

interface BackgroundEffectsSectionProps {
  backgrounds: BackgroundEffect[];
  selectedBackground: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/**
 * unknown for the customize module.
 */
/**
 * Background Effects Section section component.
 */
export function BackgroundEffectsSection({
  backgrounds,
  selectedBackground,
  previewingLockedItem,
  onSelect,
}: BackgroundEffectsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {backgrounds.map((bg, index) => {
        const isPreviewing = previewingLockedItem === bg.id;
        return (
          <motion.div
            key={bg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <GlassCard
              variant={
                selectedBackground === bg.id || isPreviewing
                  ? 'neon'
                  : bg.unlocked
                    ? 'crystal'
                    : 'frosted'
              }
              glow={selectedBackground === bg.id || isPreviewing}
              glowColor={
                isPreviewing
                  ? 'rgba(234, 179, 8, 0.4)'
                  : selectedBackground === bg.id
                    ? 'rgba(139, 92, 246, 0.3)'
                    : undefined
              }
              className={`relative cursor-pointer p-4 transition-all hover:scale-[1.02] ${
                isPreviewing ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => onSelect(bg.id, bg.unlocked)}
            >
              {/* Background Preview */}
              <motion.div
                className="relative mb-3 h-40 overflow-hidden rounded-lg"
                style={{ background: bg.preview }}
                animate={
                  bg.animated
                    ? {
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }
                    : {}
                }
                transition={bg.animated ? { duration: 10, repeat: Infinity } : {}}
              >
                {bg.animated && (
                  <div className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    Animated
                  </div>
                )}
              </motion.div>

              {/* Background Name */}
              <h4 className="mb-1 text-sm font-semibold text-white">{bg.name}</h4>

              {/* Description */}
              <p className="mb-2 text-xs text-white/60">{bg.description}</p>

              {/* Performance */}
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-white/60">Performance:</span>
                <span
                  className={`font-medium ${bg.performance === 'light' ? 'text-green-400' : bg.performance === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {bg.performance.toUpperCase()}
                </span>
              </div>

              {/* Status */}
              {bg.unlocked ? (
                selectedBackground === bg.id ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2">
                    <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Active</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(bg.id, bg.unlocked);
                    }}
                    className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    Apply
                  </button>
                )
              ) : isPreviewing ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-3 py-2">
                  <EyeIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Previewing</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-1">
                    <LockClosedIcon className="h-4 w-4 text-white/40" />
                    <span className="text-xs text-white/60">Click to Preview</span>
                  </div>
                  <p className="mt-1 text-center text-xs text-white/40">{bg.unlockRequirement}</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
