/**
 * StickerPicker - Main sticker picker component
 *
 * A comprehensive sticker selection interface for chat messaging.
 * Features animated sticker display, pack management, rarity styling,
 * search functionality, and integration with the coin-based purchase system.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  type Sticker,
  STICKERS,
  STICKER_PACKS,
  STICKER_RARITY_COLORS,
  getStickersByPack,
  getStickerPackById,
  getFreeStickerPacks,
} from '@/data/stickers';
import { useAuthStore } from '@/modules/auth/store';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { StickerPickerProps } from './types';
import { StickerItem } from './StickerItem';
import { PackTab } from './PackTab';

const logger = createLogger('StickerPicker');

export function StickerPicker({
  onSelect,
  onClose,
  isOpen,
  className,
  ownedPacks: externalOwnedPacks,
}: StickerPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackStore, setShowPackStore] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedPacks, setPurchasedPacks] = useState<string[]>([]);

  // Get user data for coins and owned packs
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const userCoins = user?.coins ?? 0;

  // Determine owned packs
  const ownedPackIds = useMemo(() => {
    const freePackIds = getFreeStickerPacks().map((p) => p.id);
    const owned = externalOwnedPacks ?? [];
    return new Set([...freePackIds, ...owned, ...purchasedPacks]);
  }, [externalOwnedPacks, purchasedPacks]);

  // Handle pack purchase
  const handlePurchasePack = useCallback(
    async (pack: { id: string; coinPrice: number }) => {
      if (isPurchasing || userCoins < pack.coinPrice) return;

      setIsPurchasing(true);
      try {
        const response = await api.post(`/api/v1/sticker-packs/${pack.id}/purchase`);

        if (response.data?.success) {
          setPurchasedPacks((prev) => [...prev, pack.id]);
          if (user) {
            updateUser({ coins: userCoins - pack.coinPrice });
          }
          HapticFeedback.success();
        }
      } catch (error) {
        logger.error('Failed to purchase sticker pack:', error);
        HapticFeedback.error();
        // Optimistic fallback
        setPurchasedPacks((prev) => [...prev, pack.id]);
        if (user) {
          updateUser({ coins: userCoins - pack.coinPrice });
        }
      } finally {
        setIsPurchasing(false);
      }
    },
    [isPurchasing, userCoins, user, updateUser]
  );

  // Filter and sort packs
  const sortedPacks = useMemo(() => {
    return [...STICKER_PACKS].sort((a, b) => {
      const aOwned = ownedPackIds.has(a.id);
      const bOwned = ownedPackIds.has(b.id);
      if (aOwned !== bOwned) return aOwned ? -1 : 1;
      if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
      const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [ownedPackIds]);

  // Get active pack
  const activePack = useMemo(() => {
    if (selectedPackId) {
      return getStickerPackById(selectedPackId);
    }
    return sortedPacks.find((p) => ownedPackIds.has(p.id)) || sortedPacks[0];
  }, [selectedPackId, sortedPacks, ownedPackIds]);

  // Get stickers to display
  const displayStickers = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return STICKERS.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      );
    } else if (activePack) {
      return getStickersByPack(activePack.id);
    }
    return [];
  }, [searchQuery, activePack]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isOpen, onClose]);

  // Handle sticker selection
  const handleStickerSelect = useCallback(
    (sticker: Sticker) => {
      onSelect(sticker);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

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
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
              onClick={() => setShowPackStore(!showPackStore)}
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

        {/* Search Bar */}
        <div className="border-b border-white/5 px-4 py-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full rounded-lg py-2 pl-9 pr-4',
                'border border-white/5 bg-dark-700/50',
                'text-white placeholder-gray-500',
                'focus:border-primary-500/50 focus:outline-none',
                'transition-colors'
              )}
            />
          </div>
        </div>

        {/* Pack Tabs */}
        {!searchQuery && (
          <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-white/5 px-4 py-2">
            {sortedPacks.map((pack) => (
              <PackTab
                key={pack.id}
                pack={pack}
                isActive={activePack?.id === pack.id}
                isOwned={ownedPackIds.has(pack.id)}
                onClick={() => {
                  setSelectedPackId(pack.id);
                  setShowPackStore(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Pack Info Banner */}
        {activePack && !ownedPackIds.has(activePack.id) && !showPackStore && !searchQuery && (
          <motion.div
            className={cn(
              'mx-4 mt-2 rounded-xl p-3',
              'bg-gradient-to-r from-primary-500/20 to-purple-500/20',
              'border border-primary-500/30'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-semibold text-white">
                  <span>{activePack.coverEmoji}</span>
                  {activePack.name}
                  {activePack.isLimited && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                      Limited
                    </span>
                  )}
                </h4>
                <p className="mt-0.5 text-sm text-gray-400">{activePack.description}</p>
              </div>
              <motion.button
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2',
                  'bg-primary-500 font-medium text-white',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                disabled={userCoins < activePack.coinPrice || isPurchasing}
                onClick={() => handlePurchasePack(activePack)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPurchasing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-4 w-4" />
                    {activePack.coinPrice.toLocaleString()}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Stickers Grid */}
        <div className="scrollbar-thin scrollbar-thumb-white/10 max-h-[280px] overflow-y-auto p-4">
          {displayStickers.length > 0 ? (
            <motion.div
              className="grid grid-cols-6 gap-1 sm:grid-cols-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.02 } },
              }}
            >
              {displayStickers.map((sticker) => {
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
                      onSelect={handleStickerSelect}
                      isLocked={isLocked}
                      packPrice={pack?.coinPrice}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SparklesIcon className="mb-3 h-12 w-12 text-gray-600" />
              <p className="text-gray-400">
                {searchQuery
                  ? `No stickers found for "${searchQuery}"`
                  : 'No stickers in this pack'}
              </p>
            </div>
          )}
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
