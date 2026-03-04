/**
 * useIdentityCustomization Hook
 *
 * Encapsulates all state, filtering logic, and handlers for the
 * IdentityCustomization page.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useGamificationStore } from '@/modules/gamification/store';
import {
  useCustomizationStore,
  type ProfileCardStyle,
} from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';
import { ALL_BORDERS } from '@/data/borderCollections';
import {
  fetchBorders,
  fetchTitles,
  fetchBadges,
} from '@/modules/gamification/store/gamification-queries';

import type { Rarity, Border, Title, Badge, ProfileLayout } from './types';
import {
  getV2BorderType,
  LEGACY_BORDER_ID_TO_V2_TYPE,
} from './constants';

export type SectionId = 'borders' | 'titles' | 'badges' | 'layouts';

/**
 * Hook for managing identity customization.
 */
export function useIdentityCustomization() {
  const { user } = useAuthStore();
  const { level: _level } = useGamificationStore();
  void _level; // Reserved for future use

  const store = useCustomizationStore();
  const {
    avatarBorder,
    title,
    equippedBadges,
    profileLayout,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateIdentity,
    setAvatarBorder,
    selectBorderId,
    setEquippedTitle,
    setEquippedBadges,
  } = store;

  const [activeSection, setActiveSection] = useState<SectionId>('borders');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);

  // API data state
  const [borders, setBorders] = useState<Border[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Fetch cosmetics data from API
  useEffect(() => {
    let cancelled = false;
    setIsLoadingIdentity(true);
    Promise.all([fetchBorders(), fetchTitles(), fetchBadges()])
      .then(([bordersData, titlesData, badgesData]) => {
        if (cancelled) return;
        setBorders(bordersData);
        setTitles(titlesData);
        setBadges(badgesData);
      })
      .catch(() => {
        // Errors are logged in the fetch functions
      })
      .finally(() => {
        if (!cancelled) setIsLoadingIdentity(false);
      });
    return () => { cancelled = true; };
  }, []);

  // --- Filtering ---

  const filteredBorders = borders.filter((border) => {
    const matchesSearch = border.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || border.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const filteredTitles = titles.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBadges = badges.filter((badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  // --- Border / Title store helpers ---

  const applyBorderToStore = useCallback(
    (borderId: string) => {
      const legacyV2Type = LEGACY_BORDER_ID_TO_V2_TYPE[borderId];
      if (legacyV2Type) {
        setAvatarBorder(legacyV2Type);
      } else {
        const border = ALL_BORDERS.find((b) => b.id === borderId);
        if (border) {
          setAvatarBorder(getV2BorderType(border.animationType));
        }
      }
      selectBorderId(borderId);
    },
    [setAvatarBorder, selectBorderId]
  );

  const applyTitleToStore = useCallback(
    (titleId: string | null) => {
      setEquippedTitle(titleId);
    },
    [setEquippedTitle]
  );

  // --- Preview helpers ---

  const handlePreviewItem = useCallback(
    (itemId: string, type: 'border' | 'title') => {
      setPreviewingLockedItem(itemId);
      if (type === 'border') applyBorderToStore(itemId);
      else if (type === 'title') applyTitleToStore(itemId);
      toast('👁️ Previewing item - Purchase premium to save', { icon: '✨', duration: durations.cinematic.ms });
    },
    [applyBorderToStore, applyTitleToStore]
  );

  const clearPreview = useCallback(() => {
    if (previewingLockedItem) {
      setPreviewingLockedItem(null);
      if (avatarBorder) applyBorderToStore(avatarBorder);
      if (title) applyTitleToStore(title);
    }
  }, [previewingLockedItem, avatarBorder, title, applyBorderToStore, applyTitleToStore]);

  // --- Section handlers ---

  const handleEquipBorder = (borderId: string, border: Border) => {
    if (!border.unlocked) {
      handlePreviewItem(borderId, 'border');
      return;
    }
    clearPreview();
    updateIdentity('avatarBorder', borderId);
    selectBorderId(borderId);
    applyBorderToStore(borderId);
  };

  const handleEquipTitle = (titleId: string, titleItem: Title) => {
    if (!titleItem.unlocked) {
      handlePreviewItem(titleId, 'title');
      return;
    }
    clearPreview();
    updateIdentity('title', titleId);
    applyTitleToStore(titleId);
  };

  const handleToggleBadge = (badgeId: string, badge: Badge) => {
    if (!badge.unlocked) {
      toast.error(`Unlock required: ${badge.unlockRequirement}`);
      return;
    }
    if (equippedBadges.includes(badgeId)) {
      const newBadges = equippedBadges.filter((id) => id !== badgeId);
      updateIdentity('equippedBadges', newBadges);
      setEquippedBadges(newBadges);
    } else if (equippedBadges.length < 5) {
      const newBadges = [...equippedBadges, badgeId];
      updateIdentity('equippedBadges', newBadges);
      setEquippedBadges(newBadges);
    } else {
      toast.error('Maximum 5 badges can be equipped');
    }
  };

  const handleSelectLayout = (layoutId: string, layout: ProfileLayout) => {
    if (!layout.unlocked) {
      toast('👁️ Previewing layout - Premium required to use', { icon: '✨', duration: durations.cinematic.ms });
      return;
    }
    updateIdentity('profileLayout', layoutId);
     
    store.setProfileCardStyle(layoutId as ProfileCardStyle);
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    if (previewingLockedItem) {
      toast.error('🔒 Premium item selected! Purchase premium to save these customizations.', {
        duration: 4000,
        icon: '💎',
      });
      return;
    }
    try {
      await saveCustomizations(user.id);
      toast.success('Identity customizations saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save customizations');
    }
  };

  return {
    // State
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    selectedRarity,
    setSelectedRarity,
    previewingLockedItem,

    // Store values
    avatarBorder,
    title,
    equippedBadges,
    profileLayout,
    isSaving,
    error,
    isLoadingIdentity,

    // Data counts (for section tabs)
    bordersCount: borders.length,
    titlesCount: titles.length,
    badgesCount: badges.length,

    // Filtered data
    filteredBorders,
    filteredTitles,
    filteredBadges,

    // Handlers
    handleEquipBorder,
    handleEquipTitle,
    handleToggleBadge,
    handleSelectLayout,
    handleSaveChanges,
  };
}
