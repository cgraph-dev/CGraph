/**
 * Animation sets section for effects customization
 * @module pages/customize/effects-customization
 */

import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { AnimationSet } from './types';

// =============================================================================
// ANIMATION SETS SECTION
// =============================================================================

interface AnimationSetsSectionProps {
  animations: AnimationSet[];
  selectedAnimation: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/**
 * unknown for the customize module.
 */
/**
 * Animation Sets Section section component.
 */
export function AnimationSetsSection({
  animations,
  selectedAnimation,
  previewingLockedItem,
  onSelect,
}: AnimationSetsSectionProps) {
  return (
    <div className="space-y-3">
      {animations.map((anim, index) => {
        const isPreviewing = previewingLockedItem === anim.id;
        return (
          <motion.div
            key={anim.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <GlassCard
              variant={
                selectedAnimation === anim.speed || isPreviewing
                  ? 'neon'
                  : anim.unlocked
                    ? 'crystal'
                    : 'frosted'
              }
              glow={selectedAnimation === anim.speed || isPreviewing}
              glowColor={
                isPreviewing
                  ? 'rgba(234, 179, 8, 0.4)'
                  : selectedAnimation === anim.speed
                    ? 'rgba(139, 92, 246, 0.3)'
                    : undefined
              }
              className={`relative cursor-pointer p-4 transition-all hover:scale-[1.01] ${
                isPreviewing ? 'ring-2 ring-yellow-500' : ''
              }`}
              onClick={() => onSelect(anim.id, anim.unlocked)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="mb-1 text-base font-bold text-white">{anim.name}</h4>
                  <p className="mb-2 text-sm text-white/60">{anim.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-white/60">
                      Speed: <span className="font-medium text-primary-400">{anim.speed}</span>
                    </span>
                    <span className="text-white/60">
                      Easing: <span className="font-medium text-primary-400">{anim.easing}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Animation Preview */}
                  <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-lg bg-dark-800">
                    <motion.div
                      className="h-8 w-8 rounded-lg bg-primary-600"
                      animate={{ x: [-20, 20, -20] }}
                      transition={{
                        duration:
                          anim.speed === 'instant'
                            ? 0
                            : anim.speed === 'fast'
                              ? 0.3
                              : anim.speed === 'normal'
                                ? 0.5
                                : anim.speed === 'smooth'
                                  ? 0.7
                                  : 1,
                         
                        ease: anim.easing as import('framer-motion').Easing,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    />
                  </div>

                  {/* Status Button */}
                  {anim.unlocked ? (
                    selectedAnimation === anim.speed ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                        <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Active</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(anim.id, anim.unlocked);
                        }}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                      >
                        Apply
                      </button>
                    )
                  ) : isPreviewing ? (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2">
                      <EyeIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">Previewing</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                      <LockClosedIcon className="h-5 w-5 text-white/40" />
                      <span className="text-sm text-white/60">Click to Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}
