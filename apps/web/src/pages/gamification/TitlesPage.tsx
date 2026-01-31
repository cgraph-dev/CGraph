/**
 * Titles Page
 *
 * Title collection browser with equip/unequip functionality.
 * Displays all available and owned titles with rarity and animations.
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TitlesPage');
import {
  TagIcon,
  SparklesIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ShoppingBagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import { TITLES, type Title, type TitleRarity } from '@/data/titles';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// ==================== TYPES ====================

interface OwnedTitle {
  id: string;
  title_id: string;
  unlocked_at: string;
}

type TitleTab = 'owned' | 'all' | 'purchasable';

// ==================== CONSTANTS ====================

const TABS: { id: TitleTab; name: string; icon: React.ReactNode }[] = [
  { id: 'owned', name: 'My Titles', icon: <TagIcon className="h-4 w-4" /> },
  { id: 'all', name: 'All Titles', icon: <StarIcon className="h-4 w-4" /> },
  { id: 'purchasable', name: 'Shop', icon: <ShoppingBagIcon className="h-4 w-4" /> },
];

const RARITY_ORDER: TitleRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'unique',
];

const RARITY_STYLES: Record<TitleRarity, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  mythic: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400' },
  unique: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400' },
};

// ==================== TITLE CARD ====================

interface TitleCardProps {
  title: Title;
  isOwned: boolean;
  isEquipped: boolean;
  onEquip: () => void;
  onUnequip: () => void;
  onPurchase?: () => void;
  isLoading?: boolean;
}

function TitleCard({
  title,
  isOwned,
  isEquipped,
  onEquip,
  onUnequip,
  onPurchase,
  isLoading,
}: TitleCardProps) {
  const styles = RARITY_STYLES[title.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative rounded-2xl p-4 transition-all ${styles.bg} border ${styles.border} ${
        isEquipped ? 'shadow-lg shadow-primary-500/20 ring-2 ring-primary-500' : ''
      } ${!isOwned ? 'opacity-70' : ''}`}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-2 -top-2 rounded-full bg-primary-500 p-1"
        >
          <CheckCircleIcon className="h-4 w-4 text-white" />
        </motion.div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {/* Title Preview */}
        <div className="flex justify-center">
          <TitleBadge title={title} size="lg" animated={isOwned} showTooltip={false} />
        </div>

        {/* Info */}
        <div className="text-center">
          <p className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
            {title.rarity}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{title.description}</p>
        </div>

        {/* Unlock requirement or price */}
        {!isOwned && (
          <div className="text-center text-xs text-gray-500">
            {title.coinPrice ? (
              <span className="flex items-center justify-center gap-1">
                <SparklesIcon className="h-3 w-3 text-yellow-400" />
                {title.coinPrice} coins
              </span>
            ) : title.unlockRequirement ? (
              <span className="flex items-center justify-center gap-1">
                <LockClosedIcon className="h-3 w-3" />
                {title.unlockRequirement}
              </span>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          {isOwned ? (
            isEquipped ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onUnequip();
                  HapticFeedback.light();
                }}
                disabled={isLoading}
                className="rounded-lg bg-dark-700 px-3 py-1.5 text-xs font-medium text-gray-400 disabled:opacity-50"
              >
                Unequip
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onEquip();
                  HapticFeedback.medium();
                }}
                disabled={isLoading}
                className="rounded-lg bg-gradient-to-r from-primary-500 to-purple-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {isLoading ? 'Equipping...' : 'Equip'}
              </motion.button>
            )
          ) : title.coinPrice && onPurchase ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onPurchase();
                HapticFeedback.medium();
              }}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              <ShoppingBagIcon className="h-3 w-3" />
              Purchase
            </motion.button>
          ) : (
            <span className="rounded-lg bg-dark-800 px-3 py-1.5 text-xs text-gray-500">Locked</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function TitlesPage() {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<TitleTab>('owned');
  const [ownedTitles, setOwnedTitles] = useState<OwnedTitle[]>([]);
  const [equippedTitleId, setEquippedTitleId] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch owned titles
  useEffect(() => {
    let isMounted = true;

    const fetchOwnedTitles = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/titles/owned');
        const data = response.data?.data || response.data || [];

        if (isMounted) {
          setOwnedTitles(data);

          // Get equipped title from user data - check both camelCase and snake_case
          const equippedTitle =
            (user as { equipped_title?: string; equippedTitle?: string })?.equipped_title ||
            (user as { equipped_title?: string; equippedTitle?: string })?.equippedTitle;
          if (equippedTitle) {
            setEquippedTitleId(equippedTitle);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch titles:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOwnedTitles();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Check if title is owned
  const isOwned = (titleId: string) => {
    return ownedTitles.some((ot) => ot.title_id === titleId || ot.id === titleId);
  };

  // Handle equip
  const handleEquip = async (titleId: string) => {
    setActionLoading(titleId);
    try {
      await api.post(`/api/v1/titles/${titleId}/equip`);
      setEquippedTitleId(titleId);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to equip title:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle unequip
  const handleUnequip = async () => {
    setActionLoading('unequip');
    try {
      await api.post('/api/v1/titles/unequip');
      setEquippedTitleId(null);
      HapticFeedback.light();
    } catch (error) {
      logger.error('Failed to unequip title:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle purchase
  const handlePurchase = async (titleId: string) => {
    setActionLoading(titleId);
    try {
      await api.post(`/api/v1/titles/${titleId}/purchase`);
      // Refresh owned titles
      const response = await api.get('/api/v1/titles/owned');
      setOwnedTitles(response.data?.data || []);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to purchase title:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter titles based on tab and rarity
  const filteredTitles = useMemo(() => {
    let titles = TITLES;

    // Filter by tab
    switch (selectedTab) {
      case 'owned':
        titles = titles.filter((t) => isOwned(t.id));
        break;
      case 'purchasable':
        titles = titles.filter((t) => t.coinPrice && !isOwned(t.id));
        break;
      // 'all' shows everything
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      titles = titles.filter((t) => t.rarity === selectedRarity);
    }

    // Sort by rarity then name
    return titles.sort((a, b) => {
      const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedTab, selectedRarity, ownedTitles]);

  // Stats
  const stats = useMemo(
    () => ({
      owned: ownedTitles.length,
      total: TITLES.length,
      byRarity: RARITY_ORDER.reduce(
        (acc, rarity) => {
          acc[rarity] = {
            owned: TITLES.filter((t) => t.rarity === rarity && isOwned(t.id)).length,
            total: TITLES.filter((t) => t.rarity === rarity).length,
          };
          return acc;
        },
        {} as Record<TitleRarity, { owned: number; total: number }>
      ),
    }),
    [ownedTitles]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-dark-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <TagIcon className="h-8 w-8 text-primary-400" />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                  Titles
                </h1>
                <p className="text-sm text-gray-400">
                  {stats.owned} / {stats.total} collected
                </p>
              </div>
            </div>

            {/* Currently equipped */}
            {equippedTitleId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Equipped:</span>
                <TitleBadge title={equippedTitleId} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Rarity Stats */}
        <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-7">
          {RARITY_ORDER.map((rarity) => {
            const data = stats.byRarity[rarity];
            const styles = RARITY_STYLES[rarity];
            return (
              <motion.button
                key={rarity}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRarity(selectedRarity === rarity ? 'all' : rarity);
                  HapticFeedback.light();
                }}
                className={`rounded-xl p-2 transition-all ${styles.bg} border ${
                  selectedRarity === rarity ? styles.border : 'border-transparent'
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${styles.text} truncate`}
                >
                  {rarity}
                </p>
                <p className="text-sm font-bold text-white">
                  {data.owned}/{data.total}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedTab(tab.id);
                HapticFeedback.light();
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.name}
            </motion.button>
          ))}
        </div>

        {/* Title Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filteredTitles.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <TagIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-400">No titles found</h3>
            <p className="text-sm text-gray-500">
              {selectedTab === 'owned'
                ? 'Unlock titles through achievements and purchases!'
                : 'Try adjusting your filters'}
            </p>
          </GlassCard>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredTitles.map((title) => (
                <TitleCard
                  key={title.id}
                  title={title}
                  isOwned={isOwned(title.id)}
                  isEquipped={equippedTitleId === title.id}
                  onEquip={() => handleEquip(title.id)}
                  onUnequip={handleUnequip}
                  onPurchase={title.coinPrice ? () => handlePurchase(title.id) : undefined}
                  isLoading={actionLoading === title.id || actionLoading === 'unequip'}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
