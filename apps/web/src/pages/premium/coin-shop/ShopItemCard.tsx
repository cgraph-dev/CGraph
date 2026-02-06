/**
 * ShopItemCard component - displays purchasable shop items
 */

import { motion } from 'framer-motion';
import { CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { RARITY_COLORS } from './constants';
import type { ShopItem } from './types';

interface ShopItemCardProps {
  item: ShopItem;
  index: number;
  isOwned: boolean;
  canAfford: boolean;
  isPurchasing: boolean;
  onPurchase: (item: ShopItem) => void;
}

export function ShopItemCard({
  item,
  index,
  isOwned,
  canAfford,
  isPurchasing,
  onPurchase,
}: ShopItemCardProps) {
  const colors = RARITY_COLORS[item.rarity];

  return (
    <motion.div
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
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              {item.rarity}
            </span>
            <p className="mt-1 line-clamp-2 text-sm text-gray-400">{item.description}</p>
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
            onClick={() => onPurchase(item)}
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
}
