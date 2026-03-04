/**
 * Marketplace listing detail modal.
 * @module
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useMarketplaceStore } from '@/modules/gamification/store';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { ITEM_TYPE_LABELS, RARITY_COLORS, type ListingDetailModalProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Listing Detail Modal dialog component.
 */
export function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
  const { purchaseListing, isPurchasing } = useMarketplaceStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePurchase = async () => {
    const result = await purchaseListing(listing.id);
    if (result.success) {
      onClose();
      // Show success notification
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="flex aspect-video items-center justify-center bg-black/50 p-8">
          {listing.itemPreviewUrl ? (
            <img
              src={listing.itemPreviewUrl}
              alt={listing.itemName}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-8xl opacity-30">
              {listing.itemType === 'avatar_border' && '🎨'}
              {listing.itemType === 'profile_theme' && '🖼️'}
              {listing.itemType === 'chat_effect' && '✨'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{listing.itemName}</h2>
              <p className="text-sm text-gray-500">{ITEM_TYPE_LABELS[listing.itemType]}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm ${RARITY_COLORS[listing.itemRarity]}`}>
              {listing.itemRarity}
            </span>
          </div>

          {/* Seller Info */}
          {listing.seller && (
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <ThemedAvatar
                src={listing.seller.avatarUrl}
                alt={listing.seller.displayName}
                size="medium"
                avatarBorderId={
                  listing.seller.avatarBorderId ?? listing.seller.avatar_border_id ?? null
                }
              />
              <div>
                <p className="font-medium">{listing.seller.displayName}</p>
                <p className="text-xs text-gray-500">@{listing.seller.username}</p>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4">
            <span className="text-gray-400">Price</span>
            <span className="text-2xl font-bold text-yellow-400">
              {listing.price.toLocaleString()} {listing.currency === 'gems' ? '💎' : '🪙'}
            </span>
          </div>

          {/* Actions */}
          {!showConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-1 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 py-3 font-medium transition-opacity hover:opacity-90"
              >
                Buy Now
              </button>
              {listing.acceptsTrades && (
                <button className="rounded-lg bg-white/10 px-6 py-3 font-medium transition-colors hover:bg-white/20">
                  Make Offer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-gray-400">
                Confirm purchase for{' '}
                <span className="font-bold text-yellow-400">{listing.price.toLocaleString()}</span>{' '}
                coins?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg bg-white/10 py-3 font-medium transition-colors hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/70"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}
