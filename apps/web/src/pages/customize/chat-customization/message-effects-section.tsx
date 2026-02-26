/**
 * MessageEffectsSection - List of message entrance effect presets
 */

import { motion } from 'framer-motion';
import { CustomizationItemCard } from '@/modules/settings/components/customize';
import type { MessageEffectsSectionProps } from './types';
import { tweens, loopWithDelay } from '@/lib/animation-presets';

/** Helper to get animation props for each effect type */
function getEffectAnimation(animation: string) {
  switch (animation) {
    case 'bounce':
      return { y: [0, -10, 0] };
    case 'slide':
      return { x: [-20, 0] };
    case 'scale':
      return { scale: [0.8, 1] };
    case 'rotate':
      return { rotate: [0, 360] };
    default:
      return {};
  }
}

/**
 * unknown for the customize module.
 */
/**
 * Message Effects Section section component.
 */
export function MessageEffectsSection({
  effects,
  selectedEffect,
  previewingLockedItem,
  onSelect,
}: MessageEffectsSectionProps) {
  return (
    <div className="space-y-3">
      {effects.map((effect, index) => (
        <CustomizationItemCard
          key={effect.id}
          item={effect}
          index={index}
          isSelected={selectedEffect === effect.id}
          isPreviewing={previewingLockedItem === effect.id}
          onSelect={onSelect}
          layout="list"
          animationDirection="slide-left"
        >
          {/* Animation Preview */}
          <div className="flex h-16 w-32 items-center justify-center rounded-lg bg-dark-800">
            <motion.div
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white"
              animate={getEffectAnimation(effect.animation)}
              transition={loopWithDelay(tweens.slow, 1)}
            >
              Message
            </motion.div>
          </div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}
