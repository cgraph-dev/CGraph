 
/**
 * useIdentityCustomization Hook
 *
 * Encapsulates all state, filtering logic, and handlers for the
 * IdentityCustomization page.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import {
  useCustomizationStore,
  type ProfileCardStyle,
} from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';
import { ALL_BORDERS, type BorderDefinition } from '@/data/avatar-borders';
import { ALL_TITLES, type TitleDefinition } from '@/data/titlesCollection';
import { ALL_BADGES, type BadgeDefinition } from '@/data/badgesCollection';
import { NAMEPLATE_REGISTRY, PROFILE_EFFECT_REGISTRY } from '@cgraph/animation-constants';

import type { Rarity, Border, Title, Badge, ProfileLayout } from './types';
import { getV2BorderType } from './constants';

export type SectionId =
  | 'borders'
  | 'titles'
  | 'badges'
  | 'layouts'
  | 'name-styles'
  | 'nameplates'
  | 'effects';

/** Map static BorderDefinition to the component's Border type */
function mapBorderDefinition(b: BorderDefinition): Border {
  return {
    id: b.id,
    name: b.name,
    rarity: b.rarity,
    animation: b.animationType,
    colors: b.colors,
    unlocked: b.unlocked,
    unlockRequirement: b.unlockRequirement,
  };
}

/** Map static TitleDefinition to the component's Title type */
function mapTitleDefinition(t: TitleDefinition): Title {
  return {
    id: t.id,
    name: t.name,
    animationType: t.animationType,
    gradient: t.gradient,
    unlocked: t.unlocked,
    unlockRequirement: t.unlockRequirement,
  };
}

/** Map static BadgeDefinition to the component's Badge type */
function mapBadgeDefinition(b: BadgeDefinition): Badge {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
    unlocked: b.unlocked,
    unlockRequirement: b.unlockRequirement,
  };
}

/**
 * Hook for managing identity customization.
 */
export function useIdentityCustomization() {
  const { user } = useAuthStore();
  const store = useCustomizationStore();
  const {
    avatarBorderType,
    equippedTitle,
    equippedBadges,
    profileCardStyle,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    updateIdentity,
    setAvatarBorder,
    selectBorderId,
    setEquippedTitle,
    setEquippedBadges,
    // New cosmetics
    displayNameFont,
    displayNameEffect,
    displayNameColor,
    displayNameSecondaryColor,
    equippedNameplate,
    equippedProfileEffect,
    setDisplayNameFont,
    setDisplayNameEffect,
    setDisplayNameColor,
    setDisplayNameSecondaryColor,
    setEquippedNameplate,
    setEquippedProfileEffect,
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

  // Load cosmetics data from static collections
  useEffect(() => {
    setBorders(ALL_BORDERS.map(mapBorderDefinition));
    setTitles(ALL_TITLES.map(mapTitleDefinition));
    setBadges(ALL_BADGES.map(mapBadgeDefinition));
    setIsLoadingIdentity(false);
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
      const border = ALL_BORDERS.find((b) => b.id === borderId);
      if (border) {
        setAvatarBorder(getV2BorderType(border.animationType));
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
      toast('👁️ Previewing item - Purchase premium to save', {
        icon: '✨',
        duration: durations.cinematic.ms,
      });
    },
    [applyBorderToStore, applyTitleToStore]
  );

  const clearPreview = useCallback(() => {
    if (previewingLockedItem) {
      setPreviewingLockedItem(null);
      if (avatarBorderType) applyBorderToStore(avatarBorderType);
      if (equippedTitle) applyTitleToStore(equippedTitle);
    }
  }, [
    previewingLockedItem,
    avatarBorderType,
    equippedTitle,
    applyBorderToStore,
    applyTitleToStore,
  ]);

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
      toast('👁️ Previewing layout - Premium required to use', {
        icon: '✨',
        duration: durations.cinematic.ms,
      });
      return;
    }
    updateIdentity('profileCardStyle', layoutId);

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

  // --- Display Name Style handlers ---
  const handleFontChange = (font: string) => setDisplayNameFont(font);
  const handleEffectChange = (effect: string) => setDisplayNameEffect(effect);
  const handleColorChange = (color: string) => setDisplayNameColor(color);
  const handleSecondaryColorChange = (color: string | null) => setDisplayNameSecondaryColor(color);

  // --- Nameplate / Profile Effect handlers ---
  const handleEquipNameplate = (nameplateId: string | null) => setEquippedNameplate(nameplateId);
  const handleEquipProfileEffect = (effectId: string | null) => setEquippedProfileEffect(effectId);

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
    avatarBorderType,
    equippedTitle,
    equippedBadges,
    profileCardStyle,
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

    // Display Name Style
    displayNameFont,
    displayNameEffect,
    displayNameColor,
    displayNameSecondaryColor,
    handleFontChange,
    handleEffectChange,
    handleColorChange,
    handleSecondaryColorChange,

    // Nameplate
    equippedNameplate,
    handleEquipNameplate,
    nameplatesCount: NAMEPLATE_REGISTRY.length,

    // Profile Effect
    equippedProfileEffect,
    handleEquipProfileEffect,
    profileEffectsCount: PROFILE_EFFECT_REGISTRY.length,
  };
}
