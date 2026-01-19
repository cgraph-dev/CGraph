import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock, Search, Sparkles, TrendingUp, Calendar, Trophy, Star } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import VisibilityBadge from '@/components/settings/VisibilityBadge';
import type { Title, TitleCategory, TitleRarity } from '@/data/titles';

/**
 * Title Selection Page
 *
 * Allows users to browse, unlock, and equip titles
 * Titles are visible to all users and appear next to username
 */
export default function TitleSelection() {
  const user = useAuthStore((state) => state.user);
  const { titles, equippedTitleId, equipTitle } = useGamificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TitleCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'all'>('all');
  const [previewTitle, setPreviewTitle] = useState<Title | null>(null);

  // Filter titles
  const filteredTitles = useMemo(() => {
    return titles.filter((title) => {
      const matchesSearch = title.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           title.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || title.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || title.rarity === selectedRarity;

      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [titles, searchQuery, selectedCategory, selectedRarity]);

  // Group titles by category
  const titlesByCategory = useMemo(() => {
    const grouped: Record<TitleCategory, Title[]> = {
      achievement: [],
      premium: [],
      event: [],
      leaderboard: [],
      special: [],
    };

    filteredTitles.forEach((title) => {
      grouped[title.category].push(title);
    });

    return grouped;
  }, [filteredTitles]);

  const userIsPremium = user?.subscription?.tier === 'pro' ||
                        user?.subscription?.tier === 'business';

  const handleEquipTitle = async (titleId: string) => {
    try {
      await equipTitle(titleId);
      // Show success notification
    } catch (error) {
      console.error('Failed to equip title:', error);
      // Show error notification
    }
  };

  const getCategoryIcon = (category: TitleCategory) => {
    const icons = {
      achievement: Trophy,
      premium: Crown,
      event: Calendar,
      leaderboard: TrendingUp,
      special: Star,
    };
    return icons[category];
  };

  const getCategoryLabel = (category: TitleCategory | 'all') => {
    const labels = {
      all: 'All Titles',
      achievement: 'Achievements',
      premium: 'Premium',
      event: 'Events',
      leaderboard: 'Leaderboard',
      special: 'Special',
    };
    return labels[category];
  };

  const getRarityColor = (rarity: TitleRarity) => {
    const colors = {
      common: 'text-gray-400 border-gray-600',
      uncommon: 'text-green-400 border-green-600',
      rare: 'text-blue-400 border-blue-600',
      epic: 'text-purple-400 border-purple-600',
      legendary: 'text-yellow-400 border-yellow-600',
      mythic: 'text-pink-400 border-pink-600',
      unique: 'text-cyan-400 border-cyan-600',
    };
    return colors[rarity];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-yellow-500" />
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
          className="mb-6 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Currently Equipped</h3>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{user?.displayName || 'User'}</span>
                <TitleBadge titleId={equippedTitleId} />
              </div>
            </div>
            <button
              onClick={() => equipTitle('')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              Unequip
            </button>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {(['achievement', 'premium', 'event', 'leaderboard', 'special'] as TitleCategory[]).map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {getCategoryLabel(category)}
              </button>
            );
          })}
        </div>

        {/* Rarity Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRarity('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedRarity === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Rarities
          </button>
          {(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique'] as TitleRarity[]).map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedRarity === rarity
                  ? `bg-${getRarityColor(rarity).split('-')[1]}-500 text-white`
                  : `${getRarityColor(rarity)} bg-gray-800 hover:bg-gray-700`
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Title Grid by Category */}
      <div className="space-y-8">
        {Object.entries(titlesByCategory).map(([category, categoryTitles]) => {
          if (categoryTitles.length === 0) return null;

          const Icon = getCategoryIcon(category as TitleCategory);

          return (
            <div key={category}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon className="w-6 h-6" />
                {getCategoryLabel(category as TitleCategory)}
                <span className="text-sm text-gray-400 font-normal">({categoryTitles.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTitles.map((title) => (
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
          );
        })}

        {filteredTitles.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No titles found matching your search.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTitle && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewTitle(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Title Preview</h3>

              <div className="mb-4 p-4 bg-gray-800 rounded-lg flex items-center justify-center gap-3">
                <span className="text-lg font-semibold">{user?.displayName || 'User'}</span>
                <TitleBadge titleId={previewTitle.id} />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">{previewTitle.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="capitalize text-gray-400">Rarity:</span>
                  <span className={getRarityColor(previewTitle.rarity)}>{previewTitle.rarity}</span>
                </div>
                {previewTitle.unlockRequirement && (
                  <div className="text-sm text-gray-400">
                    <strong>Unlock:</strong> {previewTitle.unlockRequirement}
                  </div>
                )}
                {previewTitle.coinPrice && (
                  <div className="text-sm text-gray-400">
                    <strong>Price:</strong> {previewTitle.coinPrice} coins
                  </div>
                )}
              </div>

              <button
                onClick={() => setPreviewTitle(null)}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TitleCardProps {
  title: Title;
  isEquipped: boolean;
  onEquip: () => void;
  onPreview: () => void;
  userIsPremium: boolean;
}

function TitleCard({ title, isEquipped, onEquip, onPreview, userIsPremium }: TitleCardProps) {
  const isLocked = title.isPremium && !userIsPremium;
  const isUnlocked = title.isUnlocked !== false; // Default to unlocked if not specified

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
        isEquipped
          ? 'border-purple-500 shadow-lg shadow-purple-500/50 bg-gray-900'
          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
      }`}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
    >
      <div className="p-4">
        {/* Title Preview */}
        <div className="mb-3 flex items-center justify-center py-2">
          <TitleBadge titleId={title.id} />
        </div>

        {/* Title Info */}
        <div className="text-center mb-3">
          <h4 className="font-semibold text-white mb-1">{title.name}</h4>
          <p className="text-xs text-gray-400 line-clamp-2">{title.description}</p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className={`capitalize ${title.rarity === 'common' ? 'text-gray-400' : `text-${title.rarity}-400`}`}>
            {title.rarity}
          </span>
          <span className="text-gray-500 capitalize">{title.category}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            Preview
          </button>

          {isLocked ? (
            <button
              className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-500 text-sm rounded-lg flex items-center justify-center gap-1"
              disabled
            >
              <Lock className="w-4 h-4" />
              Premium
            </button>
          ) : !isUnlocked ? (
            <button
              className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-500 text-sm rounded-lg"
              disabled
            >
              Locked
            </button>
          ) : isEquipped ? (
            <button
              onClick={onEquip}
              className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg flex items-center justify-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Equipped
            </button>
          ) : (
            <button
              onClick={onEquip}
              className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
            >
              Equip
            </button>
          )}
        </div>
      </div>

      {/* Premium Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Lock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Premium Required</p>
          </div>
        </div>
      )}

      {/* Equipped Indicator */}
      {isEquipped && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Sparkles className="w-6 h-6 text-purple-500 fill-purple-500/20" />
        </motion.div>
      )}
    </motion.div>
  );
}
