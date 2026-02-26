/**
 * useStickerPicker - Hook encapsulating StickerPicker state and logic
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import {
  type Sticker,
  STICKERS,
  STICKER_PACKS,
  getStickersByPack,
  getStickerPackById,
  getFreeStickerPacks,
} from '@/data/stickers';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const logger = createLogger('StickerPicker');

export interface UseStickerPickerOptions {
  isOpen: boolean;
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
  ownedPacks?: string[];
}

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing sticker picker.
 */
export function useStickerPicker({
  isOpen,
  onSelect,
  onClose,
  ownedPacks: externalOwnedPacks,
}: UseStickerPickerOptions) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackStore, setShowPackStore] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedPacks, setPurchasedPacks] = useState<string[]>([]);

  // User data
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const userCoins = user?.coins ?? 0;

  // Owned packs
  const ownedPackIds = useMemo(() => {
    const freePackIds = getFreeStickerPacks().map((p) => p.id);
    const owned = externalOwnedPacks ?? [];
    return new Set([...freePackIds, ...owned, ...purchasedPacks]);
  }, [externalOwnedPacks, purchasedPacks]);

  // Purchase handler
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

  // Sorted packs
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

  // Active pack
  const activePack = useMemo(() => {
    if (selectedPackId) {
      return getStickerPackById(selectedPackId);
    }
    return sortedPacks.find((p) => ownedPackIds.has(p.id)) || sortedPacks[0];
  }, [selectedPackId, sortedPacks, ownedPackIds]);

  // Displayed stickers
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

  // Outside-click handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) { // type assertion: EventTarget to Node for contains check
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen, onClose]);

  // Escape key handler
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

  // Sticker selection
  const handleStickerSelect = useCallback(
    (sticker: Sticker) => {
      onSelect(sticker);
      onClose();
    },
    [onSelect, onClose]
  );

  const selectPack = useCallback((packId: string) => {
    setSelectedPackId(packId);
    setShowPackStore(false);
  }, []);

  const togglePackStore = useCallback(() => {
    setShowPackStore((prev) => !prev);
  }, []);

  return {
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
  };
}
