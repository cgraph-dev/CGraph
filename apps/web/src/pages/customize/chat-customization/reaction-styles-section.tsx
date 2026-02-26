/**
 * ReactionStylesSection - Grid of reaction animation presets
 */

import { motion } from 'framer-motion';
import { CustomizationItemCard } from '@/modules/settings/components/customize';
import type { ReactionStylesSectionProps } from './types';
import { tweens, loopWithDelay } from '@/lib/animation-presets';

/** Helper to get animation props for each reaction type */
function getReactionAnimation(animation: string) {
  switch (animation) {
    case 'bounce':
      return { y: [0, -20, 0] };
    case 'pop':
      return { scale: [1, 1.3, 1] };
    case 'spin':
      return { rotate: [0, 360] };
    case 'pulse':
      return { scale: [1, 1.1, 1] };
    case 'shake':
      return { x: [-5, 5, -5, 5, 0] };
    case 'float':
      return { y: [0, -30], opacity: [1, 0] };
    default:
      return {};
  }
}

/**
 * unknown for the customize module.
 */
/**
 * Reaction Styles Section section component.
 */
export function ReactionStylesSection({
  reactions,
  selectedReaction,
  previewingLockedItem,
  onSelect,
}: ReactionStylesSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {reactions.map((reaction, index) => (
        <CustomizationItemCard
          key={reaction.id}
          item={reaction}
          index={index}
          isSelected={selectedReaction === reaction.id}
          isPreviewing={previewingLockedItem === reaction.id}
          onSelect={onSelect}
          layout="grid"
          centerText
        >
          {/* Reaction Preview */}
          <motion.div
            className="text-6xl"
            animate={getReactionAnimation(reaction.animation)}
            transition={loopWithDelay(tweens.slow, 1)}
          >
            ❤️
          </motion.div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}
