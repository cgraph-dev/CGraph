/**
 * PackInfoBanner - Purchase prompt for unowned sticker packs
 */

import { motion } from 'framer-motion';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { StickerPack } from '@/data/stickers';
import { cn } from '@/lib/utils';
import { tweens, loop } from '@/lib/animation-presets';

interface PackInfoBannerProps {
  pack: StickerPack;
  userCoins: number;
  isPurchasing: boolean;
  onPurchase: (pack: { id: string; coinPrice: number }) => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Pack Info Banner component.
 */
export function PackInfoBanner({ pack, userCoins, isPurchasing, onPurchase }: PackInfoBannerProps) {
  return (
    <motion.div
      className={cn(
        'mx-4 mt-2 rounded-xl p-3',
        'bg-gradient-to-r from-primary-500/20 to-purple-500/20',
        'border border-primary-500/30'
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <span>{pack.coverEmoji}</span>
            {pack.name}
            {pack.isLimited && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                Limited
              </span>
            )}
          </h4>
          <p className="mt-0.5 text-sm text-gray-400">{pack.description}</p>
        </div>
        <motion.button
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-4 py-2',
            'bg-primary-500 font-medium text-white',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          disabled={userCoins < pack.coinPrice || isPurchasing}
          onClick={() => onPurchase(pack)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPurchasing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={loop(tweens.slow)}
              className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
            />
          ) : (
            <>
              <CurrencyDollarIcon className="h-4 w-4" />
              {pack.coinPrice.toLocaleString()}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
