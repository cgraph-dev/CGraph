/**
 * StickerMessage - Renders a sticker in a chat message
 */

import { durations } from '@cgraph/animation-constants';
import { useState } from 'react';
import { motion } from 'motion/react';
import { STICKER_RARITY_COLORS } from '@/data/stickers';
import { cn } from '@/lib/utils';
import type { StickerMessageProps } from './types';
import { ANIMATION_CONFIGS, STICKER_SIZE_CLASSES } from './constants';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the chat module.
 */
/**
 * Sticker Message component.
 */
export function StickerMessage({ sticker, size = 'md' }: StickerMessageProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const rarityColors = STICKER_RARITY_COLORS[sticker.rarity];
  const animation = ANIMATION_CONFIGS[sticker.animation] || {};

  return (
    <motion.div
      className={cn(
        'inline-flex flex-col items-center rounded-2xl',
        'bg-gradient-to-br from-white/5 to-white/0',
        'border',
        rarityColors?.border,
        STICKER_SIZE_CLASSES[size]
      )}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={springs.bouncy}
      onHoverStart={() => setIsAnimating(true)}
      onClick={() => setIsAnimating(!isAnimating)}
    >
      <motion.span
        className="cursor-pointer select-none"
        animate={isAnimating ? animation : {}}
        title={sticker.name}
      >
        {sticker.emoji}
      </motion.span>

      {/* Rarity glow effect for epic+ stickers */}
      {(sticker.rarity === 'epic' || sticker.rarity === 'legendary') && (
        <motion.div
          className={cn(
            'absolute inset-0 -z-10 rounded-2xl opacity-30 blur-xl',
            rarityColors?.glow
          )}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            repeat: Infinity,
            duration: durations.loop.ms / 1000,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}
