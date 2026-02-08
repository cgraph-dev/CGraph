/**
 * StickerGrid - Displays a grid of stickers or an empty state
 */

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { type Sticker, getStickerPackById } from '@/data/stickers';
import { StickerItem } from './StickerItem';

interface StickerGridProps {
  stickers: Sticker[];
  ownedPackIds: Set<string>;
  searchQuery: string;
  onSelect: (sticker: Sticker) => void;
}

export function StickerGrid({ stickers, ownedPackIds, searchQuery, onSelect }: StickerGridProps) {
  if (stickers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <SparklesIcon className="mb-3 h-12 w-12 text-gray-600" />
        <p className="text-gray-400">
          {searchQuery ? `No stickers found for "${searchQuery}"` : 'No stickers in this pack'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-6 gap-1 sm:grid-cols-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.02 } },
      }}
    >
      {stickers.map((sticker) => {
        const pack = getStickerPackById(sticker.packId);
        const isLocked = !ownedPackIds.has(sticker.packId);

        return (
          <motion.div
            key={sticker.id}
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            <StickerItem
              sticker={sticker}
              onSelect={onSelect}
              isLocked={isLocked}
              packPrice={pack?.coinPrice}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
