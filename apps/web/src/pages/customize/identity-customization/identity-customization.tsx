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

import { motion, AnimatePresence } from 'motion/react';
import {
  PROFILE_LAYOUTS,
  getRarityColor,
} from './constants';
import { BordersSection, TitlesSection, BadgesSection, LayoutsSection } from './sections';
import { useIdentityCustomization, type SectionId } from './useIdentityCustomization';
import { SearchFilterBar } from './search-filter-bar';
import { SaveButton } from './save-button';
import { tweens } from '@/lib/animation-presets';

/**
 * Identity Customization component.
 */
export default function IdentityCustomization() {
  const {
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    selectedRarity,
    setSelectedRarity,
    previewingLockedItem,
    avatarBorder,
    title,
    equippedBadges,
    profileLayout,
    isSaving,
    error,
    isLoadingIdentity,
    bordersCount,
    titlesCount,
    badgesCount,
    filteredBorders,
    filteredTitles,
    filteredBadges,
    handleEquipBorder,
    handleEquipTitle,
    handleToggleBadge,
    handleSelectLayout,
    handleSaveChanges,
  } = useIdentityCustomization();

  const sectionTabs: { id: SectionId; label: string; count: number }[] = [
    { id: 'borders', label: 'Avatar Borders', count: bordersCount },
    { id: 'titles', label: 'Titles', count: titlesCount },
    { id: 'badges', label: 'Badges', count: badgesCount },
    { id: 'layouts', label: 'Profile Layouts', count: PROFILE_LAYOUTS.length },
  ];

  if (isLoadingIdentity) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {sectionTabs.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
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

      {/* Search & Rarity Filter */}
      <SearchFilterBar
        activeSection={activeSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
      />

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={tweens.fast}
        >
          {activeSection === 'borders' && (
            <BordersSection
              borders={filteredBorders}
              selectedBorder={avatarBorder}
              previewingBorder={previewingLockedItem}
              onEquip={handleEquipBorder}
              hasActiveFilter={searchQuery.length > 0 || selectedRarity !== 'all'}
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
      <SaveButton isSaving={isSaving} onSave={handleSaveChanges} />

      {/* Error Display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
