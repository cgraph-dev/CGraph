/** ListingCard — marketplace item listing with rarity and type labels. */
import { motion } from 'motion/react';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { ITEM_TYPE_LABELS, RARITY_COLORS, type ListingCardProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Listing Card display component.
 */
export function ListingCard({ listing, onClick }: ListingCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-orange-500/30"
    >
      {/* Preview Image */}
      <div className="flex aspect-square items-center justify-center bg-black/30 p-6">
        {listing.itemPreviewUrl ? (
          <img
            src={listing.itemPreviewUrl}
            alt={listing.itemName}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-5xl opacity-50">
            {listing.itemType === 'avatar_border' && '🎨'}
            {listing.itemType === 'profile_theme' && '🖼️'}
            {listing.itemType === 'chat_effect' && '✨'}
            {listing.itemType === 'title' && '🏷️'}
            {listing.itemType === 'badge' && '🏅'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="truncate font-medium">{listing.itemName}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${RARITY_COLORS[listing.itemRarity] || RARITY_COLORS.common}`}
          >
            {listing.itemRarity}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {ITEM_TYPE_LABELS[listing.itemType]?.split(' ')[1]}
          </span>
          <span className="font-bold text-yellow-400">
            {listing.price.toLocaleString()} {listing.currency === 'gems' ? '💎' : '🪙'}
          </span>
        </div>

        {listing.seller && (
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <ThemedAvatar
              src={listing.seller.avatarUrl}
              alt={listing.seller.displayName}
              size="xs"
              avatarBorderId={
                listing.seller.avatarBorderId ?? listing.seller.avatar_border_id ?? null
              }
            />
            <span className="truncate text-xs text-gray-500">{listing.seller.displayName}</span>
          </div>
        )}
      </div>

      {/* Trade Badge */}
      {listing.acceptsTrades && (
        <div className="absolute left-3 top-3 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
          🔄 Open to Trades
        </div>
      )}
    </motion.div>
  );
}
