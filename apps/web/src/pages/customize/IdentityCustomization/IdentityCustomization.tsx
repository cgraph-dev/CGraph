/**
 * IdentityCustomization Component
 *
 * Comprehensive identity customization page with 4 sections:
 * 1. Avatar Borders - 150+ animated borders with rarity filtering
 * 2. Titles - 30+ animated title styles
 * 3. Badges - 40+ badges, equip up to 5 with progress tracking
 * 4. Profile Card Layouts - 7 layout styles with visual previews
 *
 * Features:
 * - Live preview in right panel
 * - Search/filter functionality
 * - Rarity filtering (free, common, rare, epic, legendary, mythic)
 * - Unlock status indicators with progress tracking
 * - One-click equip/unequip
 * - Visual animations toggle
 * - Comprehensive data from collection files
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useGamificationStore } from '@/modules/gamification/store';
import {
  useCustomizationStore,
  type ProfileCardStyle,
} from '@/modules/settings/store/customization';
import toast from 'react-hot-toast';

// Import from borderCollections for mapping
import { ALL_BORDERS } from '@/data/borderCollections';

// Import types and constants from module
import type { Rarity, Border, Title, Badge, ProfileLayout } from './types';
import {
  RARITIES,
  MOCK_BORDERS,
  MOCK_TITLES,
  MOCK_BADGES,
  PROFILE_LAYOUTS,
  getRarityColor,
  getV2BorderType,
  LEGACY_BORDER_ID_TO_V2_TYPE,
} from './constants';

// Import section components
import { BordersSection, TitlesSection, BadgesSection, LayoutsSection } from './sections';

export default function IdentityCustomization() {
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

  const [activeSection, setActiveSection] = useState<'borders' | 'titles' | 'badges' | 'layouts'>(
    'borders'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');

  // Track if user is previewing a locked/premium item
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);

  // Fetch customizations on mount
  useEffect(() => {
    if (user?.id) {
      fetchCustomizations(user.id);
    }
  }, [user?.id, fetchCustomizations]);

  // Filter borders by search and rarity
  const filteredBorders = MOCK_BORDERS.filter((border) => {
    const matchesSearch = border.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || border.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  // Filter titles by search
  const filteredTitles = MOCK_TITLES.filter((title) =>
    title.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter badges by search and rarity
  const filteredBadges = MOCK_BADGES.filter((badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  // Apply border selection to store for live preview
  const applyBorderToStore = useCallback(
    (borderId: string) => {
      // First check legacy mapping
      const legacyV2Type = LEGACY_BORDER_ID_TO_V2_TYPE[borderId];
      if (legacyV2Type) {
        setAvatarBorder(legacyV2Type);
      } else {
        // Find border in new collection and map its animation type
        const border = ALL_BORDERS.find((b) => b.id === borderId);
        if (border) {
          const v2Type = getV2BorderType(border.animationType);
          setAvatarBorder(v2Type);
        }
      }
      selectBorderId(borderId);
    },
    [setAvatarBorder, selectBorderId]
  );

  // Apply title selection to store for live preview
  const applyTitleToStore = useCallback(
    (titleId: string | null) => {
      setEquippedTitle(titleId);
    },
    [setEquippedTitle]
  );

  // Preview a locked/premium item without saving
  const handlePreviewItem = useCallback(
    (itemId: string, type: 'border' | 'title') => {
      setPreviewingLockedItem(itemId);
      if (type === 'border') {
        applyBorderToStore(itemId);
      } else if (type === 'title') {
        applyTitleToStore(itemId);
      }
      toast('👁️ Previewing item - Purchase premium to save', {
        icon: '✨',
        duration: 3000,
      });
    },
    [applyBorderToStore, applyTitleToStore]
  );

  // Clear preview when changing sections
  const clearPreview = useCallback(() => {
    if (previewingLockedItem) {
      setPreviewingLockedItem(null);
      // Restore original selections
      if (avatarBorder) applyBorderToStore(avatarBorder);
      if (title) applyTitleToStore(title);
    }
  }, [previewingLockedItem, avatarBorder, title, applyBorderToStore, applyTitleToStore]);

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
        duration: 3000,
      });
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customizations');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'borders', label: 'Avatar Borders', count: MOCK_BORDERS.length },
          { id: 'titles', label: 'Titles', count: MOCK_TITLES.length },
          { id: 'badges', label: 'Badges', count: MOCK_BADGES.length },
          { id: 'layouts', label: 'Profile Layouts', count: PROFILE_LAYOUTS.length },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
              activeSection === section.id
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {section.label}
            <span className="ml-2 text-xs opacity-60">({section.count})</span>
          </button>
        ))}
      </div>

      {/* Search Bar (for borders, titles, badges) */}
      {activeSection !== 'layouts' && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSection}...`}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Rarity Filter (for borders and badges) */}
          {(activeSection === 'borders' || activeSection === 'badges') && (
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as Rarity | 'all')}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All Rarities</option>
              {RARITIES.map((rarity) => (
                <option key={rarity.value} value={rarity.value}>
                  {rarity.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === 'borders' && (
            <BordersSection
              borders={filteredBorders}
              selectedBorder={avatarBorder}
              previewingBorder={previewingLockedItem}
              onEquip={handleEquipBorder}
            />
          )}

          {activeSection === 'titles' && (
            <TitlesSection
              titles={filteredTitles}
              selectedTitle={title}
              previewingTitle={previewingLockedItem}
              onEquip={handleEquipTitle}
            />
          )}

          {activeSection === 'badges' && (
            <BadgesSection
              badges={filteredBadges}
              equippedBadges={equippedBadges}
              onToggle={handleToggleBadge}
              getRarityColor={getRarityColor}
            />
          )}

          {activeSection === 'layouts' && (
            <LayoutsSection
              layouts={PROFILE_LAYOUTS}
              selectedLayout={profileLayout}
              onSelect={handleSelectLayout}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
