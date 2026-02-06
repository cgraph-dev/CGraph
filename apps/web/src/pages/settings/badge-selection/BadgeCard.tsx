/**
 * Badge Card Component
 */

import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { RARITY_TEXT_COLORS } from './constants';
import type { BadgeCardProps } from './types';

export function BadgeCard({
  badge,
  isEquipped,
  onEquip,
  onPreview,
  userIsPremium,
}: BadgeCardProps) {
  const isLocked = badge.isPremium && !userIsPremium;
  const isUnlocked = badge.isUnlocked;

  const getRarityColor = (rarity: string) =>
    RARITY_TEXT_COLORS[rarity] || RARITY_TEXT_COLORS.common;

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
