/**
 * Title Selection Hook — manages state and filtering logic
 */

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { useProfileStore } from '@/modules/social/store/profileStore.impl';
import { ALL_TITLES } from '@/data/titlesCollection';
import { toast } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';
import type { TitleRarity } from '@/data/titles';
import type { PreviewTitle } from './types';

const logger = createLogger('TitleSelection');

/** Map TitleDefinition[] to PreviewTitle[] */
const MAPPED_TITLES: PreviewTitle[] = ALL_TITLES.map((t) => ({
  id: t.id,
  name: t.displayName || t.name,
  description: t.description,
  color: t.colors[0] ?? '#a855f7',
  rarity: t.rarity satisfies TitleRarity,
}));

/**
 * unknown for the settings module.
 */
/**
 * Hook for managing title selection.
 */
export function useTitleSelection() {
  const user = useAuthStore((state) => state.user);
  const equippedTitleId = useCustomizationStore((s) => s.equippedTitle) ?? null;
  const titles = MAPPED_TITLES;
  const profileEquipTitle = useProfileStore((s) => s.equipTitle);

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

  const setEquippedTitle = useCustomizationStore((s) => s.setEquippedTitle);

  const handleEquipTitle = async (titleId: string) => {
    try {
      await profileEquipTitle(titleId || null);
      setEquippedTitle(titleId || null);
      toast.success('Title equipped successfully!');
    } catch (error) {
      logger.error('Failed to equip title:', error);
      toast.error('Failed to equip title. Please try again.');
    }
  };

  return {
    displayName,
    equippedTitleId,
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
