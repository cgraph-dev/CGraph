/**
 * LayoutsSection Component
 *
 * Displays the profile layout selection grid with visual previews.
 */

import { motion } from 'motion/react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { ProfileLayout } from '../types';

export interface LayoutsSectionProps {
  layouts: ProfileLayout[];
  selectedLayout: string;
  onSelect: (layoutId: string, layout: ProfileLayout) => void;
}

/**
 * Visual preview components for each layout type
 */
function LayoutPreview({ preview }: { preview: string }) {
  const baseClasses = 'w-full h-full rounded-lg overflow-hidden';

  switch (preview) {
    case 'classic':
      return (
        <div
          className={`${baseClasses} flex flex-col items-center bg-gradient-to-br from-dark-700 to-dark-800 p-3`}
        >
          {/* Classic: Avatar centered, info below */}
          <div className="mb-2 h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500" />
          <div className="mb-1 h-2 w-16 rounded bg-white/30" />
          <div className="mb-2 h-1.5 w-12 rounded bg-white/20" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-4 rounded bg-white/20" />
            ))}
          </div>
        </div>
      );
    case 'modern':
      return (
        <div
          className={`${baseClasses} flex gap-2 bg-gradient-to-br from-dark-700 to-dark-800 p-2`}
        >
          {/* Modern: Split panel */}
          <div className="flex w-1/3 flex-col items-center justify-center">
            <div className="mb-1 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="h-1.5 w-8 rounded bg-white/30" />
          </div>
          <div className="flex w-2/3 flex-col justify-center gap-1.5">
            <div className="h-2 w-full rounded bg-white/20" />
            <div className="h-2 w-3/4 rounded bg-white/15" />
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 w-3 rounded bg-white/20" />
              ))}
            </div>
          </div>
        </div>
      );
    case 'compact':
      return (
        <div
          className={`${baseClasses} flex items-center gap-2 bg-gradient-to-br from-dark-700 to-dark-800 p-2`}
        >
          {/* Compact: Single row */}
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
          <div className="flex-1">
            <div className="mb-1 h-2 w-full rounded bg-white/30" />
            <div className="h-1.5 w-2/3 rounded bg-white/20" />
          </div>
          <div className="flex gap-0.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-3 w-3 rounded bg-white/20" />
            ))}
          </div>
        </div>
      );
    case 'showcase':
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-dark-700 to-dark-800 p-2`}>
          {/* Showcase: Large badges */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500" />
            <div className="h-1.5 w-12 rounded bg-white/30" />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded bg-gradient-to-br from-white/20 to-white/10"
              >
                <div className="h-2/3 w-2/3 rounded-full bg-white/30" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'gaming':
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-dark-700 to-dark-800 p-2`}>
          {/* Gaming: Stats focused */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500" />
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {['🎮', '🏆', '⚔️'].map((emoji, i) => (
              <div key={i} className="rounded bg-white/10 p-1 text-center">
                <span className="text-xs">{emoji}</span>
                <div className="mt-1 h-1 w-full rounded bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div
          className={`${baseClasses} flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800`}
        >
          <span className="text-2xl">🎨</span>
        </div>
      );
  }
}

/**
 * unknown for the customize module.
 */
/**
 * Layouts Section — page layout wrapper.
 */
export function LayoutsSection({ layouts, selectedLayout, onSelect }: LayoutsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {layouts.map((layout, index) => (
        <motion.div
          key={layout.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlassCard
            variant={layout.unlocked ? 'neon' : ('frosted' as const)}
            glow={selectedLayout === layout.id}
            glowColor={selectedLayout === layout.id ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative cursor-pointer p-6 transition-all hover:scale-[1.02]`}
            onClick={() => onSelect(layout.id, layout)}
          >
            {/* Layout Preview */}
            <div className="mb-4 aspect-video overflow-hidden rounded-lg border border-white/10">
              <LayoutPreview preview={layout.preview} />
            </div>

            {/* Layout Name */}
            <h4 className="mb-2 text-lg font-bold text-white">{layout.name}</h4>

            {/* Layout Description */}
            <p className="mb-4 text-sm text-white/60">{layout.description}</p>

            {/* Status */}
            {layout.unlocked ? (
              selectedLayout === layout.id ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                  <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Active</span>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(layout.id, layout);
                  }}
                  className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Apply Layout
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <LockClosedIcon className="mx-auto mb-3 h-12 w-12 text-white/40" />
                  <p className="px-4 text-sm text-white/60">Unlock at Level 30</p>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
