/**
 * TitleCard Component
 *
 * Individual title card with equip/unequip/purchase functionality
 */

import { motion } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { TitleBadge } from '@/modules/gamification/components/TitleBadge';
import type { TitleCardProps } from './types';
import { RARITY_STYLES } from './constants';

export function TitleCard({
  title,
  isOwned,
  isEquipped,
  actionLoading,
  onEquip,
  onUnequip,
  onPurchase,
}: TitleCardProps) {
  const style = RARITY_STYLES[title.rarity];
  const isLoading = actionLoading === title.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard
        className={`relative overflow-hidden ${isEquipped ? 'ring-accent-primary ring-2' : ''}`}
      >
        {/* Rarity gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-10`} />

        <div className="relative p-4">
          {/* Header with badge */}
          <div className="mb-3 flex items-start justify-between">
            <TitleBadge title={title.id} size="lg" />
            {isEquipped && (
              <span className="text-accent-primary flex items-center gap-1 text-xs">
                <CheckCircleIcon className="h-4 w-4" />
                Equipped
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-text-secondary mb-3 line-clamp-2 text-sm">{title.description}</p>

          {/* Rarity indicator */}
          <div className="mb-3 flex items-center gap-2">
            <SparklesIcon className={`h-4 w-4 ${style.text}`} />
            <span className={`text-xs font-medium ${style.text} capitalize`}>{title.rarity}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwned ? (
              isEquipped ? (
                <button
                  onClick={onUnequip}
                  disabled={actionLoading === 'unequip'}
                  className="bg-surface-secondary hover:bg-surface-tertiary flex-1 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'unequip' ? 'Unequipping...' : 'Unequip'}
                </button>
              ) : (
                <button
                  onClick={() => onEquip(title.id)}
                  disabled={isLoading}
                  className="bg-accent-primary hover:bg-accent-primary/80 flex-1 rounded-lg px-3 py-2 text-sm text-white transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Equipping...' : 'Equip'}
                </button>
              )
            ) : title.coinPrice ? (
              <button
                onClick={() => onPurchase(title.id)}
                disabled={isLoading}
                className={`flex flex-1 items-center justify-center gap-2 bg-gradient-to-r px-3 py-2 text-sm ${style.gradient} rounded-lg text-white transition-opacity disabled:opacity-50`}
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                {isLoading ? 'Purchasing...' : `${title.coinPrice} Coins`}
              </button>
            ) : (
              <span className="text-text-tertiary bg-surface-secondary flex-1 rounded-lg px-3 py-2 text-center text-sm">
                {title.unlockRequirement || 'Special Unlock'}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
