/**
 * PackTab - Sticker pack tab selector
 */

import { motion } from 'motion/react';
import { ClockIcon, LockClosedIcon, GiftIcon } from '@heroicons/react/24/outline';
import { STICKER_RARITY_COLORS } from '@/data/stickers';
import { cn } from '@/lib/utils';
import type { PackTabProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Pack Tab component.
 */
export function PackTab({ pack, isActive, isOwned, onClick }: PackTabProps) {
  const rarityColors = STICKER_RARITY_COLORS[pack.rarity];

  return (
    <motion.button
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all',
        'whitespace-nowrap text-sm font-medium',
        isActive
          ? `${rarityColors?.bg} ${rarityColors?.text}`
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-lg">{pack.coverEmoji}</span>
      <span className="hidden sm:inline">{pack.name}</span>

      {/* Pack Status Indicators */}
      {pack.isLimited && <ClockIcon className="h-3.5 w-3.5 text-amber-400" title="Limited Time" />}
      {!isOwned && !pack.isFree && <LockClosedIcon className="h-3.5 w-3.5 text-gray-500" />}
      {pack.isFree && <GiftIcon className="h-3.5 w-3.5 text-green-400" title="Free Pack" />}
    </motion.button>
  );
}
