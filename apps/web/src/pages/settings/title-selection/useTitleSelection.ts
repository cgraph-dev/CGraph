/**
 * Title Selection Hook — manages state and filtering logic
 */

import { useState, useMemo } from 'react';
// TODO(phase-26): Rewire — gamification stores deleted
import { useAuthStore } from '@/modules/auth/store';
import { toast } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';
import type { TitleRarity } from '@/data/titles';
import type { PreviewTitle } from './types';

const logger = createLogger('TitleSelection');

/** Stable empty array for stub titles */
const EMPTY_TITLES: PreviewTitle[] = [];

/**
 * unknown for the settings module.
 */
/**
 * Hook for managing title selection.
 */
export function useTitleSelection() {
  const user = useAuthStore((state) => state.user);
  // TODO(phase-26): Rewire — gamification stores deleted
  const titles = EMPTY_TITLES;
  const equippedTitleId: string | null = null;
  const equipTitle = async (_titleId: string) => {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'all'>('all');
  const [previewTitle, setPreviewTitle] = useState<PreviewTitle | null>(null);

  const filteredTitles = useMemo(() => {
    return titles.filter((title) => {
      const matchesSearch =
        title.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        title.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = selectedRarity === 'all' || title.rarity === selectedRarity;
      return matchesSearch && matchesRarity;
    });
  }, [titles, searchQuery, selectedRarity]);

  const userIsPremium = user?.isPremium || false;
  const displayName = user?.displayName || 'User';

  const handleEquipTitle = async (titleId: string) => {
    try {
      await equipTitle(titleId);
      toast.success('Title equipped successfully!');
    } catch (error) {
      logger.error('Failed to equip title:', error);
      toast.error('Failed to equip title. Please try again.');
    }
  };

  return {
    displayName,
    equippedTitleId,
    equipTitle,
    filteredTitles,
    handleEquipTitle,
    previewTitle,
    searchQuery,
    selectedRarity,
    setPreviewTitle,
    setSearchQuery,
    setSelectedRarity,
    userIsPremium,
  };
}
