/**
 * StickerPicker - Main sticker picker component
 *
 * Composes sub-components and the useStickerPicker hook to provide
 * a sticker selection interface for chat messaging.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { STICKER_RARITY_COLORS } from '@/data/stickers';
import { cn } from '@/lib/utils';
import type { StickerPickerProps } from './types';
import { PackTab } from './pack-tab';
import { StickerSearchBar } from './sticker-search-bar';
import { StickerGrid } from './sticker-grid';
import { PackInfoBanner } from './pack-info-banner';
import { useStickerPicker } from './useStickerPicker';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the chat module.
 */
/**
 * Sticker Picker component.
 */
export function StickerPicker({
  onSelect,
  onClose,
  isOpen,
  className,
  ownedPacks,
}: StickerPickerProps) {
  const {
    pickerRef,
    searchQuery,
    setSearchQuery,
    showPackStore,
    togglePackStore,
    isPurchasing,
    userCoins,
    ownedPackIds,
    sortedPacks,
    activePack,
    displayStickers,
    handlePurchasePack,
    handleStickerSelect,
    selectPack,
  } = useStickerPicker({ isOpen, onSelect, onClose, ownedPacks });

  if (!isOpen) return null;

  const showBanner =
    !!activePack && !ownedPackIds.has(activePack.id) && !showPackStore && !searchQuery;

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        className={cn(
          'absolute bottom-full left-0 right-0 z-50 mb-2',
          'rounded-2xl bg-dark-800/95 backdrop-blur-xl',
          'border border-white/10 shadow-2xl shadow-black/50',
          'overflow-hidden',
          className
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={springs.stiff}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            <span className="font-semibold text-white">Stickers</span>
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              <CurrencyDollarIcon className="h-3.5 w-3.5" />
              <span>{userCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                showPackStore
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
              onClick={togglePackStore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showPackStore ? 'My Stickers' : 'Get More'}
            </motion.button>

            <motion.button
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <StickerSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Pack Tabs */}
        {!searchQuery && (
          <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-white/5 px-4 py-2">
            {sortedPacks.map((pack) => (
              <PackTab
                key={pack.id}
                pack={pack}
                isActive={activePack?.id === pack.id}
                isOwned={ownedPackIds.has(pack.id)}
                onClick={() => selectPack(pack.id)}
              />
            ))}
          </div>
        )}

        {/* Pack Info Banner */}
        {showBanner && activePack && (
          <PackInfoBanner
            pack={activePack}
            userCoins={userCoins}
            isPurchasing={isPurchasing}
            onPurchase={handlePurchasePack}
          />
        )}

        {/* Stickers Grid */}
        <div className="scrollbar-thin scrollbar-thumb-white/10 max-h-[280px] overflow-y-auto p-4">
          <StickerGrid
            stickers={displayStickers}
            ownedPackIds={ownedPackIds}
            searchQuery={searchQuery}
            onSelect={handleStickerSelect}
          />
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-xs text-gray-500">
          <span>
            {ownedPackIds.size} packs owned • {displayStickers.length} stickers
          </span>
          {activePack && (
            <span className={STICKER_RARITY_COLORS[activePack.rarity]?.text}>
              {activePack.rarity.charAt(0).toUpperCase() + activePack.rarity.slice(1)} Pack
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StickerPicker;
