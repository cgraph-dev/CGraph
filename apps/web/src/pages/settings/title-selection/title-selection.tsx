/**
 * Title Selection Page
 *
 * Allows users to browse, unlock, and equip titles.
 * Titles are visible to all users and appear next to username.
 */

import { motion } from 'motion/react';
import { Search, Sparkles } from 'lucide-react';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import { useTitleSelection } from './useTitleSelection';
import { getRarityColor, RARITY_LIST } from './constants';
import { TitleCard } from './title-card';
import { TitlePreviewModal } from './title-preview-modal';

/**
 * Title Selection component.
 */
export default function TitleSelection() {
  const {
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
  } = useTitleSelection();

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Titles</h1>
          <VisibilityBadge visible="others" />
        </div>
        <p className="text-gray-400">
          Select a title to display next to your username. Titles are visible to everyone.
        </p>
      </div>

      {/* Currently Equipped */}
      {equippedTitleId && (
        <motion.div
          className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-400">Currently Equipped</h3>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{displayName}</span>
                {/* TODO(phase-26): Rewire — gamification components deleted (TitleBadge) */}
                <span className="text-sm text-purple-400">{equippedTitleId}</span>
              </div>
            </div>
            <button
              onClick={() => equipTitle('')}
              className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.10]"
            >
              Unequip
            </button>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Rarity Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRarity('all')}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedRarity === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'
            }`}
          >
            All Rarities
          </button>
          {RARITY_LIST.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors ${
                selectedRarity === rarity
                  ? `bg-${getRarityColor(rarity).split('-')[1]}-500 text-white`
                  : `${getRarityColor(rarity)} bg-white/[0.04] hover:bg-white/[0.06]`
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Title Grid */}
      <div className="space-y-8">
        {filteredTitles.length > 0 ? (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-6 w-6" />
              All Titles
              <span className="text-sm font-normal text-gray-400">({filteredTitles.length})</span>
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTitles.map((title) => (
                <TitleCard
                  key={title.id}
                  title={title}
                  isEquipped={equippedTitleId === title.id}
                  onEquip={() => handleEquipTitle(title.id)}
                  onPreview={() => setPreviewTitle(title)}
                  userIsPremium={userIsPremium}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <p className="text-gray-400">No titles found matching your search.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <TitlePreviewModal
        previewTitle={previewTitle}
        displayName={displayName}
        getRarityColor={getRarityColor}
        onClose={() => setPreviewTitle(null)}
      />
    </div>
  );
}
