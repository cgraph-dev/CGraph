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

import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_BORDERS,
  MOCK_TITLES,
  MOCK_BADGES,
  PROFILE_LAYOUTS,
  getRarityColor,
} from './constants';
import { BordersSection, TitlesSection, BadgesSection, LayoutsSection } from './sections';
import { useIdentityCustomization, type SectionId } from './useIdentityCustomization';
import { SearchFilterBar } from './SearchFilterBar';
import { SaveButton } from './SaveButton';

const SECTION_TABS: { id: SectionId; label: string; count: number }[] = [
  { id: 'borders', label: 'Avatar Borders', count: MOCK_BORDERS.length },
  { id: 'titles', label: 'Titles', count: MOCK_TITLES.length },
  { id: 'badges', label: 'Badges', count: MOCK_BADGES.length },
  { id: 'layouts', label: 'Profile Layouts', count: PROFILE_LAYOUTS.length },
];

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
    filteredBorders,
    filteredTitles,
    filteredBadges,
    handleEquipBorder,
    handleEquipTitle,
    handleToggleBadge,
    handleSelectLayout,
    handleSaveChanges,
  } = useIdentityCustomization();

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {SECTION_TABS.map((section) => (
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
