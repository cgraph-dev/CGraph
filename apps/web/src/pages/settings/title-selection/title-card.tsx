/**
 * TitleCard — a single title card with preview / equip actions
 */

import { motion } from 'motion/react';
import { Lock, Sparkles } from 'lucide-react';
import type { TitleCardProps } from './types';
import { InlineTitle } from '@/shared/components/ui/inline-title';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the settings module.
 */
/**
 * Title Card display component.
 */
export function TitleCard({
  title,
  isEquipped,
  onEquip,
  onPreview,
  userIsPremium: _userIsPremium,
}: TitleCardProps) {
  const isUnlocked = title.unlocked !== false;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
        isEquipped
          ? 'border-purple-500 bg-[rgb(30,32,40)] shadow-lg shadow-purple-500/50'
          : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.08]'
      }`}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-center py-2">
          <InlineTitle titleId={title.id} size="sm" />
        </div>

        <div className="mb-3 text-center">
          <h4 className="mb-1 font-semibold text-white">{title.name}</h4>
          <p className="line-clamp-2 text-xs text-gray-400">{title.description}</p>
        </div>

        <div className="mb-3 flex items-center justify-between text-xs">
          <span
            className={`capitalize ${title.rarity === 'common' ? 'text-gray-400' : 'text-purple-400'}`}
          >
            {title.rarity}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.10]"
          >
            Preview
          </button>

          {!isUnlocked ? (
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

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
            <p className="text-xs font-semibold text-white">Locked</p>
          </div>
        </div>
      )}

      {isEquipped && (
        <motion.div
          className="absolute right-2 top-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springs.bouncy}
        >
          <Sparkles className="h-6 w-6 fill-purple-500/20 text-purple-500" />
        </motion.div>
      )}
    </motion.div>
  );
}
