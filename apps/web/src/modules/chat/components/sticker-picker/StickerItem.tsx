/**
 * StickerItem - Individual sticker display with animation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { STICKER_RARITY_COLORS } from '@/data/stickers';
import { cn } from '@/lib/utils';
import type { StickerItemProps } from './types';
import { ANIMATION_CONFIGS, RARITY_ICONS } from './constants';

export function StickerItem({ sticker, onSelect, isLocked, packPrice }: StickerItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const rarityColors = STICKER_RARITY_COLORS[sticker.rarity];
  const animation = ANIMATION_CONFIGS[sticker.animation] || {};

  return (
    <motion.button
      className={cn(
        'relative flex items-center justify-center rounded-xl p-2 transition-all',
        'group hover:bg-white/10',
        isLocked && 'cursor-not-allowed opacity-50',
        rarityColors?.border && `border ${rarityColors.border}`
      )}
      style={{
        background:
          isHovered && !isLocked
            ? `linear-gradient(135deg, ${sticker.colors[0]}20, ${sticker.colors[1] || sticker.colors[0]}20)`
            : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isLocked && onSelect(sticker)}
      whileHover={!isLocked ? { scale: 1.1 } : undefined}
      whileTap={!isLocked ? { scale: 0.95 } : undefined}
      title={isLocked ? `Unlock for ${packPrice} coins` : sticker.name}
    >
      {/* Sticker Emoji with Animation */}
      <motion.span
        className="select-none text-3xl"
        animate={isHovered && !isLocked ? animation : {}}
      >
        {sticker.emoji}
      </motion.span>

      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
          <LockClosedIcon className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Rarity Indicator */}
      {sticker.rarity !== 'common' && RARITY_ICONS[sticker.rarity] && (
        <span
          className={cn(
            'absolute -right-1 -top-1 rounded-full p-0.5',
            rarityColors?.bg,
            rarityColors?.text
          )}
        >
          {RARITY_ICONS[sticker.rarity]}
        </span>
      )}

      {/* Hover Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              'absolute -bottom-8 left-1/2 z-50 -translate-x-1/2',
              'whitespace-nowrap rounded-md px-2 py-1 text-xs',
              'border border-white/10 bg-dark-800',
              rarityColors?.text
            )}
          >
            {sticker.name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
