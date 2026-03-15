/**
 * TitlesSection Component
 *
 * Displays the titles selection list with animations.
 */

import { durations } from '@cgraph/animation-constants';
import { useState } from 'react';
import { motion } from 'motion/react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { Title } from '../types';
import type { TitleAnimationType } from '@/data/titlesCollection';

export interface TitlesSectionProps {
  titles: Title[];
  selectedTitle: string | null;
  previewingTitle: string | null;
  onEquip: (titleId: string, title: Title) => void;
}

/**
 * Animated title text component with all 11 animation types
 */
function AnimatedTitleText({
  name,
  animationType,
  gradient,
}: {
  name: string;
  animationType: TitleAnimationType;
  gradient: string;
}) {
  // Base text styling
  const baseClass = `text-lg font-bold ${gradient}`;

  // Animation variants for different title animations
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'fade':
        return {
          animate: { opacity: [0.5, 1, 0.5] },
          transition: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'glow':
        return {
          animate: {
            textShadow: [
              '0 0 4px currentColor',
              '0 0 20px currentColor, 0 0 40px currentColor',
              '0 0 4px currentColor',
            ],
          },
          transition: {
            duration: durations.ambient.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'pulse':
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'shimmer':
        return {
          animate: {
            backgroundPosition: ['200% center', '-200% center'],
          },
          transition: { duration: durations.cinematic.ms / 1000, repeat: Infinity, ease: 'linear' },
          style: {
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%), ${gradient}`,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          },
        };
      case 'rainbow':
        return {
          animate: {
            filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'linear' },
        };
      case 'typing':
        return {
          animate: { width: ['0%', '100%', '100%', '0%'] },
          transition: { duration: 4, repeat: Infinity, times: [0, 0.4, 0.6, 1] },
          style: { overflow: 'hidden', whiteSpace: 'nowrap' as const },
        };
      case 'glitch':
        return {
          animate: {
            x: [0, -2, 2, -1, 1, 0],
            filter: [
              'none',
              'drop-shadow(2px 0 #ff0000) drop-shadow(-2px 0 #00ffff)',
              'drop-shadow(-2px 0 #ff0000) drop-shadow(2px 0 #00ffff)',
              'none',
            ],
          },
          transition: { duration: durations.slower.ms / 1000, repeat: Infinity, repeatDelay: 2 },
        };
      case 'wave':
        return {
          animate: { y: [0, -4, 0, 4, 0] },
          transition: {
            duration: durations.ambient.ms / 1000,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
      case 'bounce':
        return {
          animate: { y: [0, -8, 0] },
          transition: { duration: durations.dramatic.ms / 1000, repeat: Infinity, ease: 'easeOut' },
        };
      case 'neon-flicker':
        return {
          animate: {
            opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1],
            textShadow: [
              '0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor',
              '0 0 4px currentColor',
              '0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor',
            ],
          },
          transition: {
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
          },
        };
      case 'none':
      default:
        return {};
    }
  };

  const animProps = getAnimationVariants();

  return (
     
    <motion.h4 className={baseClass} {...(animProps as object)}>
      {name}
    </motion.h4>
  );
}

/**
 * unknown for the customize module.
 */
/**
 * Titles Section section component.
 */
export function TitlesSection({
  titles,
  selectedTitle,
  previewingTitle,
  onEquip,
}: TitlesSectionProps) {
  const [showAnimations, setShowAnimations] = useState(true);

  return (
    <div className="space-y-4">
      {/* Animation Toggle */}
      <div className="flex items-center justify-between pb-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={showAnimations}
            onChange={(e) => setShowAnimations(e.target.checked)}
            className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.06] text-primary-500 focus:ring-primary-500"
          />
          Show Animations
        </label>
        <div className="text-sm text-gray-500">{titles.length} titles available</div>
      </div>

      <div className="space-y-3">
        {titles.map((title, index) => {
          const isSelected = selectedTitle === title.id;
          const isPreviewing = previewingTitle === title.id;
          const isActive = isSelected || isPreviewing;

          return (
            <motion.div
              key={title.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant={isActive ? 'neon' : 'crystal'}
                glow={isActive}
                glowColor={
                  isPreviewing
                    ? 'rgba(234, 179, 8, 0.3)'
                    : isSelected
                      ? 'rgba(139, 92, 246, 0.3)'
                      : undefined
                }
                className={`relative cursor-pointer p-4 transition-all hover:scale-[1.02]`}
                onClick={() => onEquip(title.id, title)}
              >
                {/* Preview indicator for locked items */}
                {isPreviewing && (
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black">
                    <EyeIcon className="h-3 w-3" />
                    Preview
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Animated title display */}
                    {showAnimations ? (
                      <AnimatedTitleText
                        name={title.name}
                        animationType={title.animationType}
                        gradient={title.gradient}
                      />
                    ) : (
                      <h4 className={`mb-1 text-lg font-bold ${title.gradient}`}>{title.name}</h4>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
                        {title.animationType === 'none'
                          ? '⚡ Static'
                          : `✨ ${title.animationType.charAt(0).toUpperCase() + title.animationType.slice(1)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {title.unlocked ? (
                      isSelected ? (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2">
                          <CheckCircleIconSolid className="h-5 w-5 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Equipped</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEquip(title.id, title);
                          }}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                        >
                          Equip
                        </button>
                      )
                    ) : isPreviewing ? (
                      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2">
                        <EyeIcon className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">Previewing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                        <EyeIcon className="h-5 w-5 text-white/40" />
                        <span className="text-sm text-white/60">Preview</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unlock requirement hint */}
                {!title.unlocked && !isPreviewing && (
                  <div className="mt-2 text-xs text-white/40">🔒 {title.unlockRequirement}</div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}

        {titles.length === 0 && (
          <div className="py-12 text-center text-white/60">
            No titles found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
