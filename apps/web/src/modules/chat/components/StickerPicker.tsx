/**
 * StickerPicker Component
 *
 * A comprehensive sticker selection interface for chat messaging.
 * Features animated sticker display, pack management, rarity styling,
 * search functionality, and integration with the coin-based purchase system.
 *
 * @version 0.7.52
 * @since 2026-01-05
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('StickerPicker');
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  SparklesIcon,
  StarIcon,
  ClockIcon,
  GiftIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
// CheckCircleIcon reserved for future use (pack ownership indicator)

import {
  Sticker,
  StickerPack,
  STICKERS,
  STICKER_PACKS,
  STICKER_RARITY_COLORS,
  getStickersByPack,
  getStickerPackById,
  getFreeStickerPacks,
  type StickerRarity,
} from '@/data/stickers';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// ==================== TYPE DEFINITIONS ====================

export interface StickerPickerProps {
  /** Callback when a sticker is selected */
  onSelect: (sticker: Sticker) => void;
  /** Callback to close the picker */
  onClose: () => void;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Optional className for positioning */
  className?: string;
  /** Optional list of owned pack IDs (defaults to free packs) */
  ownedPacks?: string[];
}

interface StickerItemProps {
  sticker: Sticker;
  onSelect: (sticker: Sticker) => void;
  isLocked: boolean;
  packPrice?: number;
}

interface PackTabProps {
  pack: StickerPack;
  isActive: boolean;
  isOwned: boolean;
  onClick: () => void;
}

// ==================== ANIMATION MAPPING ====================

import type { TargetAndTransition } from 'framer-motion';

/**
 * Maps sticker animation types to Tailwind/Framer Motion configurations
 */
const ANIMATION_CONFIGS: Record<string, TargetAndTransition> = {
  bounce: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.5 } },
  pulse: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } },
  shake: { x: [-5, 5, -5, 5, 0], transition: { repeat: Infinity, duration: 0.5 } },
  wiggle: { rotate: [-3, 3, -3], transition: { repeat: Infinity, duration: 0.5 } },
  float: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' } },
  pop: { scale: [0, 1.2, 1], transition: { duration: 0.3 } },
  wave: { rotate: [0, 20, -20, 0], transition: { repeat: Infinity, duration: 1 } },
  zoom: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } },
  flip: { rotateY: [0, 360], transition: { repeat: Infinity, duration: 1 } },
  swing: { rotate: [0, 15, -10, 5, -5, 0], transition: { duration: 1 } },
  jello: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], transition: { duration: 1 } },
  heartbeat: { scale: [1, 1.3, 1, 1.3, 1], transition: { repeat: Infinity, duration: 1.5 } },
  flash: { opacity: [1, 0.5, 1, 0.5, 1], transition: { repeat: Infinity, duration: 1 } },
  rubberband: { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], transition: { duration: 1 } },
  spin: { rotate: [0, 360], transition: { repeat: Infinity, duration: 1, ease: 'linear' } },
  none: {},
};

// ==================== RARITY ICONS ====================

const RARITY_ICONS: Record<StickerRarity, React.ReactNode> = {
  common: null,
  uncommon: <SparklesIcon className="h-3 w-3" />,
  rare: <StarIcon className="h-3 w-3" />,
  epic: <SparklesIcon className="h-3 w-3" />,
  legendary: <StarIcon className="h-3 w-3" />,
};

// ==================== CATEGORY DISPLAY NAMES ====================
// Reserved for future category filter feature
// const CATEGORY_DISPLAY: Record<StickerCategory, { name: string; emoji: string }> = {
//   emotions: { name: 'Emotions', emoji: '😊' },
//   reactions: { name: 'Reactions', emoji: '👍' },
//   memes: { name: 'Memes', emoji: '😂' },
//   seasonal: { name: 'Seasonal', emoji: '🎄' },
//   gaming: { name: 'Gaming', emoji: '🎮' },
//   animals: { name: 'Animals', emoji: '🐱' },
//   food: { name: 'Food', emoji: '🍕' },
//   special: { name: 'Special', emoji: '✨' },
// };

// ==================== STICKER ITEM COMPONENT ====================

function StickerItem({ sticker, onSelect, isLocked, packPrice }: StickerItemProps) {
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

// ==================== PACK TAB COMPONENT ====================

function PackTab({ pack, isActive, isOwned, onClick }: PackTabProps) {
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

// ==================== MAIN STICKER PICKER COMPONENT ====================

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

  // Determine owned packs (free packs + externally provided owned packs + purchased in session)
  const ownedPackIds = useMemo(() => {
    const freePackIds = getFreeStickerPacks().map((p) => p.id);
    const owned = externalOwnedPacks ?? [];
    return new Set([...freePackIds, ...owned, ...purchasedPacks]);
  }, [externalOwnedPacks, purchasedPacks]);

  // Handle pack purchase
  const handlePurchasePack = useCallback(
    async (pack: StickerPack) => {
      if (isPurchasing || userCoins < pack.coinPrice) return;

      setIsPurchasing(true);
      try {
        const response = await api.post(`/api/v1/sticker-packs/${pack.id}/purchase`);

        if (response.data?.success) {
          // Update local state
          setPurchasedPacks((prev) => [...prev, pack.id]);

          // Update user coins
          if (user) {
            updateUser({ coins: userCoins - pack.coinPrice });
          }

          HapticFeedback.success();
        }
      } catch (error) {
        logger.error('Failed to purchase sticker pack:', error);
        HapticFeedback.error();

        // Optimistic fallback - still unlock locally if API fails
        // This allows offline/demo mode to work
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
      // Owned packs first
      const aOwned = ownedPackIds.has(a.id);
      const bOwned = ownedPackIds.has(b.id);
      if (aOwned !== bOwned) return aOwned ? -1 : 1;

      // Free packs next
      if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;

      // Then by rarity (common first for accessibility)
      const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [ownedPackIds]);

  // Get active pack
  const activePack = useMemo(() => {
    if (selectedPackId) {
      return getStickerPackById(selectedPackId);
    }
    // Default to first owned pack
    return sortedPacks.find((p) => ownedPackIds.has(p.id)) || sortedPacks[0];
  }, [selectedPackId, sortedPacks, ownedPackIds]);

  // Get stickers to display
  const displayStickers = useMemo(() => {
    let stickers: Sticker[] = [];

    if (searchQuery.trim()) {
      // Search across all stickers
      const query = searchQuery.toLowerCase();
      stickers = STICKERS.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      );
    } else if (activePack) {
      // Get stickers from active pack
      stickers = getStickersByPack(activePack.id);
    }

    return stickers;
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

            {/* User Coins Display */}
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              <CurrencyDollarIcon className="h-3.5 w-3.5" />
              <span>{userCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pack Store Toggle */}
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

            {/* Close Button */}
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

        {/* Pack Info Banner (for non-owned packs) */}
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
                visible: {
                  transition: {
                    staggerChildren: 0.02,
                  },
                },
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

// ==================== STICKER MESSAGE RENDERER ====================

/**
 * Renders a sticker in a chat message
 */
export interface StickerMessageProps {
  sticker: Sticker;
  size?: 'sm' | 'md' | 'lg';
}

export function StickerMessage({ sticker, size = 'md' }: StickerMessageProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const rarityColors = STICKER_RARITY_COLORS[sticker.rarity];
  const animation = ANIMATION_CONFIGS[sticker.animation] || {};

  const sizeClasses = {
    sm: 'text-4xl p-2',
    md: 'text-6xl p-3',
    lg: 'text-8xl p-4',
  };

  return (
    <motion.div
      className={cn(
        'inline-flex flex-col items-center rounded-2xl',
        'bg-gradient-to-br from-white/5 to-white/0',
        'border',
        rarityColors?.border,
        sizeClasses[size]
      )}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
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
            duration: 2,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}

// ==================== STICKER BUTTON TRIGGER ====================

/**
 * Button to trigger the sticker picker
 */
export interface StickerButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export function StickerButton({ onClick, isActive, className }: StickerButtonProps) {
  return (
    <motion.button
      className={cn(
        'rounded-lg p-2.5 transition-colors',
        isActive
          ? 'bg-primary-500/20 text-primary-400'
          : 'text-gray-400 hover:bg-white/10 hover:text-white',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Send a sticker"
    >
      <SparklesIcon className="h-5 w-5" />
    </motion.button>
  );
}

export default StickerPicker;
