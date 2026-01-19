import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock, Search, Sparkles, TrendingUp, Calendar, Trophy, Star } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import VisibilityBadge from '@/components/settings/VisibilityBadge';
import { toast } from '@/components/Toast';
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
      const matchesSearch =
        title.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const userIsPremium =
    user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'business';

  const handleEquipTitle = async (titleId: string) => {
    try {
      await equipTitle(titleId);
      toast.success('Title equipped successfully!');
    } catch (error) {
      console.error('Failed to equip title:', error);
      toast.error('Failed to equip title. Please try again.');
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
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
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
                <span className="text-lg font-semibold">{user?.displayName || 'User'}</span>
                <TitleBadge titleId={equippedTitleId} />
              </div>
            </div>
            <button
              onClick={() => equipTitle('')}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
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
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {(['achievement', 'premium', 'event', 'leaderboard', 'special'] as TitleCategory[]).map(
            (category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {getCategoryLabel(category)}
                </button>
              );
            }
          )}
        </div>

        {/* Rarity Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRarity('all')}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedRarity === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Rarities
          </button>
          {(
            ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unique'] as TitleRarity[]
          ).map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors ${
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
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Icon className="h-6 w-6" />
                {getCategoryLabel(category as TitleCategory)}
                <span className="text-sm font-normal text-gray-400">({categoryTitles.length})</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <p className="text-gray-400">No titles found matching your search.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTitle && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewTitle(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold">Title Preview</h3>

              <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-gray-800 p-4">
                <span className="text-lg font-semibold">{user?.displayName || 'User'}</span>
                <TitleBadge titleId={previewTitle.id} />
              </div>

              <div className="mb-4 space-y-2">
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
                className="w-full rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
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
          ? 'border-purple-500 bg-gray-900 shadow-lg shadow-purple-500/50'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
    >
      <div className="p-4">
        {/* Title Preview */}
        <div className="mb-3 flex items-center justify-center py-2">
          <TitleBadge titleId={title.id} />
        </div>

        {/* Title Info */}
        <div className="mb-3 text-center">
          <h4 className="mb-1 font-semibold text-white">{title.name}</h4>
          <p className="line-clamp-2 text-xs text-gray-400">{title.description}</p>
        </div>

        {/* Meta Info */}
        <div className="mb-3 flex items-center justify-between text-xs">
          <span
            className={`capitalize ${title.rarity === 'common' ? 'text-gray-400' : `text-${title.rarity}-400`}`}
          >
            {title.rarity}
          </span>
          <span className="capitalize text-gray-500">{title.category}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-600"
          >
            Preview
          </button>

          {isLocked ? (
            <button
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-500/20 px-3 py-2 text-sm text-yellow-500"
              disabled
            >
              <Lock className="h-4 w-4" />
              Premium
            </button>
          ) : !isUnlocked ? (
            <button
              className="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-sm text-blue-500"
              disabled
            >
              Locked
            </button>
          ) : isEquipped ? (
            <button
              onClick={onEquip}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-purple-500 px-3 py-2 text-sm text-white"
            >
              <Sparkles className="h-4 w-4" />
              Equipped
            </button>
          ) : (
            <button
              onClick={onEquip}
              className="flex-1 rounded-lg bg-purple-500 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-600"
            >
              Equip
            </button>
          )}
        </div>
      </div>

      {/* Premium Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
            <p className="text-xs font-semibold text-white">Premium Required</p>
          </div>
        </div>
      )}

      {/* Equipped Indicator */}
      {isEquipped && (
        <motion.div
          className="absolute right-2 top-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Sparkles className="h-6 w-6 fill-purple-500/20 text-purple-500" />
        </motion.div>
      )}
    </motion.div>
  );
}
