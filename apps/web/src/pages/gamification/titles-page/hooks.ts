/**
 * TitlesPage Hooks
 *
 * Custom hooks for titles functionality
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { TITLES, type Title, type TitleRarity } from '@/data/titles';
import { useAuthStore } from '@/modules/auth/store';
import type { OwnedTitle, TitleTab, TitleStats } from './types';
import { RARITY_ORDER } from './constants';

const logger = createLogger('TitlesPage');

/**
 * Hook to manage titles data and actions
 */
export function useTitlesData() {
  const { user } = useAuthStore();
  const [ownedTitles, setOwnedTitles] = useState<OwnedTitle[]>([]);
  const [equippedTitleId, setEquippedTitleId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<TitleTab>('owned');
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch owned titles
  useEffect(() => {
    let isMounted = true;

    const fetchOwnedTitles = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/titles/owned');
        const data = response.data?.data || response.data || [];

        if (isMounted) {
          setOwnedTitles(data);

          const equippedTitle =
            (user as { equipped_title?: string; equippedTitle?: string })?.equipped_title ||
            (user as { equipped_title?: string; equippedTitle?: string })?.equippedTitle;
          if (equippedTitle) {
            setEquippedTitleId(equippedTitle);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch titles:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOwnedTitles();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Check if title is owned
  const isOwned = useCallback(
    (titleId: string) => {
      return ownedTitles.some((ot) => ot.title_id === titleId || ot.id === titleId);
    },
    [ownedTitles]
  );

  // Handle equip
  const handleEquip = useCallback(async (titleId: string) => {
    setActionLoading(titleId);
    try {
      await api.post(`/api/v1/titles/${titleId}/equip`);
      setEquippedTitleId(titleId);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to equip title:', error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Handle unequip
  const handleUnequip = useCallback(async () => {
    setActionLoading('unequip');
    try {
      await api.post('/api/v1/titles/unequip');
      setEquippedTitleId(null);
      HapticFeedback.light();
    } catch (error) {
      logger.error('Failed to unequip title:', error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Handle purchase
  const handlePurchase = useCallback(async (titleId: string) => {
    setActionLoading(titleId);
    try {
      await api.post(`/api/v1/titles/${titleId}/purchase`);
      const response = await api.get('/api/v1/titles/owned');
      setOwnedTitles(response.data?.data || []);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to purchase title:', error);
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Filter titles based on tab and rarity
  const filteredTitles = useMemo((): Title[] => {
    let titles = TITLES;

    switch (selectedTab) {
      case 'owned':
        titles = titles.filter((t) => isOwned(t.id));
        break;
      case 'purchasable':
        titles = titles.filter((t) => t.coinPrice && !isOwned(t.id));
        break;
    }

    if (selectedRarity !== 'all') {
      titles = titles.filter((t) => t.rarity === selectedRarity);
    }

    return titles.sort((a, b) => {
      const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedTab, selectedRarity, isOwned]);

  // Stats
  const stats = useMemo(
    (): TitleStats => ({
      owned: ownedTitles.length,
      total: TITLES.length,
      byRarity: RARITY_ORDER.reduce(
        (acc, rarity) => {
          acc[rarity] = {
            owned: TITLES.filter((t) => t.rarity === rarity && isOwned(t.id)).length,
            total: TITLES.filter((t) => t.rarity === rarity).length,
          };
          return acc;
        },
        {} as Record<TitleRarity, { owned: number; total: number }>
      ),
    }),
    [ownedTitles, isOwned]
  );

  return {
    // State
    selectedTab,
    selectedRarity,
    isLoading,
    actionLoading,
    equippedTitleId,
    filteredTitles,
    stats,
    // Actions
    setSelectedTab,
    setSelectedRarity,
    isOwned,
    handleEquip,
    handleUnequip,
    handlePurchase,
  };
}
