/**
 * Title Selection Hook — manages state and filtering logic
 */

import { useState, useMemo } from 'react';
import { useGamificationStore } from '@/modules/gamification/store';
import { useAuthStore } from '@/modules/auth/store';
import { toast } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';
import type { TitleRarity } from '@/data/titles';
import type { PreviewTitle } from './types';

const logger = createLogger('TitleSelection');

export function useTitleSelection() {
  const user = useAuthStore((state) => state.user);
  const { titles, equippedTitleId, equipTitle } = useGamificationStore();

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
