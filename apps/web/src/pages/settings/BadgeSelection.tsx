import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, Search, Sparkles, Trophy, Star, Shield, Crown } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useAuthStore } from '@/stores/authStore';
import VisibilityBadge from '@/components/settings/VisibilityBadge';
import { toast } from '@/components/Toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BadgeSelection');

/**
 * Badge Selection Page
 *
 * Allows users to browse, unlock, and equip badges
 * Badges are visible to all users on profiles and in chat
 */
export default function BadgeSelection() {
  const user = useAuthStore((state) => state.user);
  const { achievements, equippedBadges, equipBadge, unequipBadge } = useGamificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [previewBadge, setPreviewBadge] = useState<any | null>(null);

  // Convert achievements to badges (achievements ARE badges in CGraph)
  const badges = useMemo(() => {
    return achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.title, // Achievement uses 'title', map to 'name' for badges
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      rarity: achievement.rarity,
      isUnlocked: achievement.unlocked, // Achievement uses 'unlocked', map to 'isUnlocked'
      isPremium: achievement.rarity === 'legendary' || achievement.rarity === 'epic',
      unlockedAt: achievement.unlockedAt,
      progress: achievement.progress,
      requirement: achievement.maxProgress,
    }));
  }, [achievements]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      const matchesSearch =
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;

      return matchesSearch && matchesCategory && matchesRarity;
    });
  }, [badges, searchQuery, selectedCategory, selectedRarity]);

  // Group badges by category
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    filteredBadges.forEach((badge) => {
      const category = badge.category ?? 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(badge);
    });

    return grouped;
  }, [filteredBadges]);

  const userIsPremium =
    user?.subscription?.tier === 'pro' || (user?.subscription?.tier as string) === 'business';

  const handleEquipBadge = async (badgeId: string) => {
    try {
      // Maximum 5 badges can be equipped
      if (equippedBadges.length >= 5 && !equippedBadges.includes(badgeId)) {
        toast.warning('You can only equip up to 5 badges. Unequip one first.');
        return;
      }

      if (equippedBadges.includes(badgeId)) {
        await unequipBadge(badgeId);
        toast.success('Badge unequipped!');
      } else {
        await equipBadge(badgeId);
        toast.success('Badge equipped!');
      }
    } catch (error) {
      logger.error('Failed to equip/unequip badge:', error);
      toast.error('Failed to update badge. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      social: Trophy,
      content: Award,
      mastery: Star,
      event: Shield,
      premium: Crown,
    };
    return icons[category] || Award;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: 'All Badges',
      social: 'Social',
      content: 'Content',
      mastery: 'Mastery',
      event: 'Events',
      premium: 'Premium',
    };
    return labels[category] || category;
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-400 border-gray-600',
      uncommon: 'text-green-400 border-green-600',
      rare: 'text-blue-400 border-blue-600',
      epic: 'text-purple-400 border-purple-600',
      legendary: 'text-yellow-400 border-yellow-600',
      mythic: 'text-pink-400 border-pink-600',
    };
    return colors[rarity] ?? colors['common']!;
  };

  const getRarityBgColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500',
      mythic: 'bg-pink-500',
    };
    return colors[rarity] ?? 'bg-gray-500';
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Award className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Badges</h1>
          <VisibilityBadge visible="others" />
        </div>
        <p className="text-gray-400">
          Equip up to 5 badges to display on your profile. Badges showcase your achievements.
        </p>
      </div>

      {/* Currently Equipped */}
      {equippedBadges.length > 0 && (
        <motion.div
          className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-400">
              Currently Equipped ({equippedBadges.length}/5)
            </h3>
            <div className="flex flex-wrap gap-3">
              {equippedBadges.map((badgeId) => {
                const badge = badges.find((b) => b.id === badgeId);
                if (!badge) return null;

                return (
                  <motion.div
                    key={badgeId}
                    className="flex items-center gap-2 rounded-lg border border-purple-500/50 bg-gray-800 px-3 py-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-sm font-medium">{badge.name}</span>
                    <button
                      onClick={() => handleEquipBadge(badgeId)}
                      className="ml-2 text-gray-400 transition-colors hover:text-red-500"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
            </div>
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
            placeholder="Search badges..."
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
          {['social', 'content', 'mastery', 'event', 'premium'].map((category) => {
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
          })}
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
          {['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors ${
                selectedRarity === rarity
                  ? `${getRarityBgColor(rarity)} text-white`
                  : `${getRarityColor(rarity)} bg-gray-800 hover:bg-gray-700`
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Grid by Category */}
      <div className="space-y-8">
        {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
          if (categoryBadges.length === 0) return null;

          const Icon = getCategoryIcon(category);

          return (
            <div key={category}>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Icon className="h-6 w-6" />
                {getCategoryLabel(category)}
                <span className="text-sm font-normal text-gray-400">({categoryBadges.length})</span>
              </h2>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {categoryBadges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEquipped={equippedBadges.includes(badge.id)}
                    onEquip={() => handleEquipBadge(badge.id)}
                    onPreview={() => setPreviewBadge(badge)}
                    userIsPremium={userIsPremium}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filteredBadges.length === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <p className="text-gray-400">No badges found matching your search.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewBadge && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewBadge(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-center">
                <div className="mb-3 text-6xl">{previewBadge.icon}</div>
                <h3 className="mb-2 text-xl font-bold">{previewBadge.name}</h3>
                <p className="mb-4 text-sm text-gray-400">{previewBadge.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-gray-400">Rarity:</span>
                    <span className={`capitalize ${getRarityColor(previewBadge.rarity)}`}>
                      {previewBadge.rarity}
                    </span>
                  </div>

                  {previewBadge.requirement && (
                    <div className="text-sm text-gray-400">
                      <strong>Requirement:</strong> {previewBadge.requirement}
                    </div>
                  )}

                  {!previewBadge.isUnlocked && previewBadge.progress !== undefined && (
                    <div className="mt-2">
                      <div className="mb-1 text-sm text-gray-400">
                        Progress: {Math.round(previewBadge.progress)}%
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-purple-500 transition-all"
                          style={{ width: `${previewBadge.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setPreviewBadge(null)}
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

interface BadgeCardProps {
  badge: any;
  isEquipped: boolean;
  onEquip: () => void;
  onPreview: () => void;
  userIsPremium: boolean;
}

function BadgeCard({ badge, isEquipped, onEquip, onPreview, userIsPremium }: BadgeCardProps) {
  const isLocked = badge.isPremium && !userIsPremium;
  const isUnlocked = badge.isUnlocked;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
        isEquipped
          ? 'border-purple-500 bg-gray-900 shadow-lg shadow-purple-500/50'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      } ${!isUnlocked ? 'opacity-50' : ''}`}
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
    >
      <div className="p-4">
        {/* Badge Icon */}
        <div className="mb-3 text-center">
          <div className="mb-2 text-5xl">{badge.icon}</div>
          <h4 className="line-clamp-1 text-sm font-semibold text-white">{badge.name}</h4>
          <span className={`text-xs capitalize ${getRarityColor(badge.rarity)}`}>
            {badge.rarity}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 rounded bg-gray-700 px-2 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
          >
            View
          </button>

          {isLocked ? (
            <button
              className="flex flex-1 items-center justify-center gap-1 rounded bg-yellow-500/20 px-2 py-1.5 text-xs text-yellow-500"
              disabled
            >
              <Lock className="h-3 w-3" />
              Premium
            </button>
          ) : !isUnlocked ? (
            <button
              className="flex-1 rounded bg-blue-500/20 px-2 py-1.5 text-xs text-blue-500"
              disabled
            >
              Locked
            </button>
          ) : isEquipped ? (
            <button
              onClick={onEquip}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-purple-500 px-2 py-1.5 text-xs text-white"
            >
              <Sparkles className="h-3 w-3" />
              Equipped
            </button>
          ) : (
            <button
              onClick={onEquip}
              className="flex-1 rounded bg-purple-500 px-2 py-1.5 text-xs text-white transition-colors hover:bg-purple-600"
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
            <p className="text-xs font-semibold text-white">Premium</p>
          </div>
        </div>
      )}

      {/* Equipped Indicator */}
      {isEquipped && (
        <motion.div
          className="absolute right-1 top-1"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Sparkles className="h-5 w-5 fill-purple-500/20 text-purple-500" />
        </motion.div>
      )}

      {/* Progress Bar (for locked badges) */}
      {!isUnlocked && badge.progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${badge.progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

function getRarityColor(rarity: string) {
  const colors: Record<string, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };
  return colors[rarity] || colors.common;
}
