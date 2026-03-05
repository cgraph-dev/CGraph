/**
 * CoinShop page - main component for purchasing coins and shop items
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CurrencyDollarIcon, ShoppingBagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { Button } from '@/components';
import { useCoinShopStore } from '@/modules/gamification/store/coinShopStore';
import { COIN_BUNDLES, SHOP_ITEMS } from './constants';
import { useCoinShop } from './useCoinShop';
import { CoinBalanceCard } from './coin-balance-card';
import { DailyBonusBanner } from './daily-bonus-banner';
import { CoinBundleCard } from './coin-bundle-card';
import { ShopItemCard } from './shop-item-card';
import { CategoryFilter } from './category-filter';
import { AmbientParticles } from './ambient-particles';

/**
 * Coin Shop component.
 */
export default function CoinShop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useAuthStore(); // Ensure user is authenticated
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch bundles from the backend API
  const { bundles: apiBundles, loading: bundlesLoading, fetchBundles } = useCoinShopStore();
  useEffect(() => { fetchBundles(); }, [fetchBundles]);
  const displayBundles = apiBundles.length > 0 ? apiBundles : COIN_BUNDLES;

  const {
    coinBalance,
    purchasingBundle,
    purchasingItem,
    ownedItems,
    dailyBonus,
    handlePurchaseBundle,
    handlePurchaseItem,
    handleClaimDailyBonus,
  } = useCoinShop();

  // Handle checkout return from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Clean up URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      newParams.delete('purchase_id');
      setSearchParams(newParams, { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, setSearchParams]);

  // Filter items by category
  const filteredItems =
    activeCategory === 'all'
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Checkout Success Banner */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4"
            >
              <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-green-400" />
              <div>
                <p className="font-semibold text-green-300">Purchase Successful!</p>
                <p className="text-sm text-green-400/80">
                  Your coins have been added to your balance. Enjoy shopping!
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="ml-auto text-green-400/60 hover:text-green-400"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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

          <CoinBalanceCard balance={coinBalance} />
        </motion.div>

        {/* Daily Bonus Banner */}
        <DailyBonusBanner dailyBonus={dailyBonus} onClaim={handleClaimDailyBonus} />

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
            {displayBundles.map((bundle, index) => (
              <CoinBundleCard
                key={bundle.id}
                bundle={bundle}
                index={index}
                isPurchasing={purchasingBundle === bundle.id}
                onPurchase={handlePurchaseBundle}
                disabled={!!purchasingBundle}
              />
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

          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

          {/* Items Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isOwned={ownedItems.includes(item.id)}
                  canAfford={coinBalance >= item.coinPrice}
                  isPurchasing={purchasingItem === item.id}
                  onPurchase={handlePurchaseItem}
                />
              ))}
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
