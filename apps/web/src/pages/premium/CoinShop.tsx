import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CoinShop');
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  SparklesIcon,
  GiftIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  FireIcon,
  StarIcon,
  PaintBrushIcon,
  MusicalNoteIcon,
  TrophyIcon,
  BoltIcon,
  HeartIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';

/**
 * Coin Shop Page
 *
 * Virtual currency shop for purchasing coins and spending them on rewards.
 * Features:
 * - Coin bundle purchases
 * - Reward redemption
 * - Transaction history
 * - Daily/Weekly bonuses
 * - Gift coins to friends
 */

interface CoinBundle {
  id: string;
  coins: number;
  bonusCoins: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'theme' | 'emoji' | 'badge' | 'effect' | 'boost' | 'gift';
  coinPrice: number;
  icon: React.ReactNode;
  preview?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  limited?: boolean;
  stock?: number;
}

const COIN_BUNDLES: CoinBundle[] = [
  { id: 'starter', coins: 100, bonusCoins: 0, price: 0.99 },
  { id: 'basic', coins: 500, bonusCoins: 50, price: 4.99 },
  { id: 'popular', coins: 1200, bonusCoins: 200, price: 9.99, popular: true },
  { id: 'value', coins: 2500, bonusCoins: 500, price: 19.99 },
  { id: 'premium', coins: 5500, bonusCoins: 1500, price: 39.99, bestValue: true },
  { id: 'ultimate', coins: 12000, bonusCoins: 4000, price: 79.99 },
];

const SHOP_ITEMS: ShopItem[] = [
  // Themes
  {
    id: 'theme_midnight',
    name: 'Midnight Aurora',
    description: 'A stunning dark theme with aurora effects',
    category: 'theme',
    coinPrice: 500,
    icon: <PaintBrushIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  {
    id: 'theme_neon',
    name: 'Neon Dreams',
    description: 'Vibrant neon colors for night owls',
    category: 'theme',
    coinPrice: 750,
    icon: <PaintBrushIcon className="h-6 w-6" />,
    rarity: 'epic',
  },
  {
    id: 'theme_galaxy',
    name: 'Galaxy Theme',
    description: 'Journey through the cosmos',
    category: 'theme',
    coinPrice: 1200,
    icon: <PaintBrushIcon className="h-6 w-6" />,
    rarity: 'legendary',
    limited: true,
  },
  // Emojis
  {
    id: 'emoji_animated',
    name: 'Animated Emoji Pack',
    description: '50 animated emojis for reactions',
    category: 'emoji',
    coinPrice: 300,
    icon: <FaceSmileIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  {
    id: 'emoji_exclusive',
    name: 'Exclusive Emoji Collection',
    description: '25 rare animated emojis',
    category: 'emoji',
    coinPrice: 600,
    icon: <FaceSmileIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  // Badges
  {
    id: 'badge_supporter',
    name: 'Early Supporter Badge',
    description: 'Show off your early support',
    category: 'badge',
    coinPrice: 200,
    icon: <StarIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  {
    id: 'badge_champion',
    name: 'Champion Badge',
    description: 'An exclusive badge for champions',
    category: 'badge',
    coinPrice: 1000,
    icon: <TrophyIcon className="h-6 w-6" />,
    rarity: 'epic',
    limited: true,
    stock: 100,
  },
  // Effects
  {
    id: 'effect_confetti',
    name: 'Confetti Effect',
    description: 'Add confetti to your messages',
    category: 'effect',
    coinPrice: 400,
    icon: <SparklesIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  {
    id: 'effect_sound',
    name: 'Sound Effects Pack',
    description: 'Custom notification sounds',
    category: 'effect',
    coinPrice: 350,
    icon: <MusicalNoteIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  // Boosts
  {
    id: 'boost_xp',
    name: 'XP Boost (7 days)',
    description: '2x XP for all actions',
    category: 'boost',
    coinPrice: 800,
    icon: <BoltIcon className="h-6 w-6" />,
    rarity: 'epic',
  },
  {
    id: 'boost_karma',
    name: 'Karma Boost (7 days)',
    description: '1.5x karma from forum posts',
    category: 'boost',
    coinPrice: 600,
    icon: <FireIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  // Gifts
  {
    id: 'gift_small',
    name: 'Gift Box (Small)',
    description: 'Send 50 coins to a friend',
    category: 'gift',
    coinPrice: 60,
    icon: <GiftIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  {
    id: 'gift_premium',
    name: 'Premium Gift',
    description: 'Gift 1 week of Premium',
    category: 'gift',
    coinPrice: 1500,
    icon: <HeartIcon className="h-6 w-6" />,
    rarity: 'legendary',
  },
];

const RARITY_COLORS = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

const CATEGORY_LABELS = {
  theme: 'Themes',
  emoji: 'Emojis',
  badge: 'Badges',
  effect: 'Effects',
  boost: 'Boosts',
  gift: 'Gifts',
};

export default function CoinShop() {
  const navigate = useNavigate();
  useAuthStore(); // Ensure user is authenticated
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [coinBalance, setCoinBalance] = useState(0);
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [dailyBonus, setDailyBonus] = useState<{ available: boolean; amount: number }>({
    available: true,
    amount: 25,
  });

  // Fetch owned items on mount
  useEffect(() => {
    async function fetchOwnedItems() {
      try {
        const response = await api.get('/api/v1/shop/owned');
        setOwnedItems(response.data.items || []);
        setCoinBalance(response.data.coin_balance || coinBalance);
        setDailyBonus(response.data.daily_bonus || dailyBonus);
      } catch (error) {
        logger.error('Failed to fetch owned items:', error);
      }
    }
    fetchOwnedItems();
  }, []);

  // Handle coin bundle purchase
  const handlePurchaseBundle = useCallback(
    async (bundle: CoinBundle) => {
      if (purchasingBundle) return;

      setPurchasingBundle(bundle.id);
      HapticFeedback.medium();

      try {
        const response = await api.post('/api/v1/shop/purchase-coins', {
          bundle_id: bundle.id,
        });

        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          // Success
          const newBalance = coinBalance + bundle.coins + bundle.bonusCoins;
          setCoinBalance(newBalance);

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          });
        }
      } catch (error) {
        logger.error('Purchase error:', error);
      } finally {
        setPurchasingBundle(null);
      }
    },
    [purchasingBundle, coinBalance]
  );

  // Handle item purchase with coins
  const handlePurchaseItem = useCallback(
    async (item: ShopItem) => {
      if (purchasingItem || coinBalance < item.coinPrice || ownedItems.includes(item.id)) return;

      setPurchasingItem(item.id);
      HapticFeedback.medium();

      try {
        await api.post('/api/v1/shop/purchase-item', {
          item_id: item.id,
        });

        // Success
        setCoinBalance((prev: number) => prev - item.coinPrice);
        setOwnedItems((prev: string[]) => [...prev, item.id]);

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#8b5cf6', '#f59e0b'],
        });
      } catch (error) {
        logger.error('Purchase error:', error);
      } finally {
        setPurchasingItem(null);
      }
    },
    [purchasingItem, coinBalance, ownedItems]
  );

  // Claim daily bonus
  const handleClaimDailyBonus = useCallback(async () => {
    if (!dailyBonus.available) return;

    HapticFeedback.success();

    try {
      const response = await api.post('/api/v1/shop/claim-daily');
      setCoinBalance((prev: number) => prev + (response.data.amount || dailyBonus.amount));
      setDailyBonus({ available: false, amount: dailyBonus.amount });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (error) {
      logger.error('Failed to claim bonus:', error);
    }
  }, [dailyBonus]);

  // Filter items by category
  const filteredItems =
    activeCategory === 'all'
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed h-1 w-1 rounded-full bg-yellow-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Coin Shop
            </h1>
            <p className="text-gray-400">Purchase coins and unlock exclusive rewards</p>
          </div>

          {/* Coin Balance */}
          <GlassCard variant="holographic" glow glowColor="rgba(245, 158, 11, 0.3)" className="p-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400">Your Balance</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(coinBalance ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Daily Bonus Banner */}
        {dailyBonus.available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard variant="neon" glow className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <GiftIcon className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-white">Daily Bonus Available!</p>
                    <p className="text-sm text-gray-400">
                      Claim {dailyBonus.amount} free coins every day
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClaimDailyBonus}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 font-semibold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Claim +{dailyBonus.amount}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Coin Bundles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-400" />
            Purchase Coins
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {COIN_BUNDLES.map((bundle, index) => (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <GlassCard
                  variant={bundle.popular || bundle.bestValue ? 'holographic' : 'frosted'}
                  glow={bundle.popular || bundle.bestValue}
                  glowColor={bundle.bestValue ? 'rgba(245, 158, 11, 0.3)' : undefined}
                  className="relative h-full overflow-hidden p-4"
                >
                  {/* Labels */}
                  {bundle.popular && (
                    <div className="absolute -right-1 -top-1">
                      <div className="rounded-bl bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        POPULAR
                      </div>
                    </div>
                  )}
                  {bundle.bestValue && (
                    <div className="absolute -right-1 -top-1">
                      <div className="rounded-bl bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        BEST VALUE
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <motion.div
                      className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CurrencyDollarIcon className="h-5 w-5 text-white" />
                    </motion.div>

                    <p className="text-xl font-bold text-white">
                      {(bundle?.coins ?? 0).toLocaleString()}
                    </p>
                    {(bundle?.bonusCoins ?? 0) > 0 && (
                      <p className="text-xs font-semibold text-green-400">
                        +{bundle.bonusCoins} bonus
                      </p>
                    )}
                    <p className="mt-2 text-lg font-semibold text-yellow-400">
                      ${bundle.price.toFixed(2)}
                    </p>

                    <motion.button
                      onClick={() => handlePurchaseBundle(bundle)}
                      disabled={!!purchasingBundle}
                      className="mt-3 w-full rounded-lg bg-dark-700 py-2 text-sm text-white transition-all hover:bg-dark-600"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {purchasingBundle === bundle.id ? (
                        <motion.div
                          className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        'Buy'
                      )}
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Shop Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <ShoppingBagIcon className="h-6 w-6 text-primary-400" />
              Rewards Shop
            </h2>
          </div>

          {/* Category Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === key
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const colors = RARITY_COLORS[item.rarity];
                const isOwned = ownedItems.includes(item.id);
                const canAfford = coinBalance >= item.coinPrice;
                const isPurchasing = purchasingItem === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <GlassCard
                      variant="frosted"
                      glow={item.limited}
                      className={`relative h-full p-4 ${isOwned ? 'opacity-75' : ''}`}
                    >
                      {/* Limited Badge */}
                      {item.limited && (
                        <div className="absolute right-2 top-2">
                          <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                            LIMITED {item.stock && `(${item.stock} left)`}
                          </span>
                        </div>
                      )}

                      {/* Owned Badge */}
                      {isOwned && (
                        <div className="absolute left-2 top-2">
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <motion.div
                          className={`h-14 w-14 rounded-xl ${colors.bg} border ${colors.border} flex flex-shrink-0 items-center justify-center`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <div className={colors.text}>{item.icon}</div>
                        </motion.div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate font-semibold text-white">{item.name}</h3>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}
                          >
                            {item.rarity}
                          </span>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-dark-700 pt-4">
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />
                          <span className="font-bold text-yellow-400">
                            {(item?.coinPrice ?? 0).toLocaleString()}
                          </span>
                        </div>

                        <motion.button
                          onClick={() => handlePurchaseItem(item)}
                          disabled={isOwned || !canAfford || isPurchasing}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            isOwned
                              ? 'cursor-default bg-green-500/20 text-green-400'
                              : canAfford
                                ? 'bg-primary-500 text-white hover:bg-primary-400'
                                : 'cursor-not-allowed bg-dark-700 text-gray-500'
                          }`}
                          whileHover={canAfford && !isOwned ? { scale: 1.05 } : {}}
                          whileTap={canAfford && !isOwned ? { scale: 0.95 } : {}}
                        >
                          {isPurchasing ? (
                            <motion.div
                              className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                          ) : isOwned ? (
                            'Owned'
                          ) : canAfford ? (
                            'Buy'
                          ) : (
                            'Need more coins'
                          )}
                        </motion.button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Back to Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-gray-400">
            Want unlimited features instead? Check out our premium plans.
          </p>
          <Button variant="secondary" onClick={() => navigate('/premium')}>
            View Premium Plans
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
