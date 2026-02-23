/**
 * Create marketplace listing form section.
 * @module
 */
import { useState } from 'react';
import { useMarketplaceStore, type ItemType } from '@/modules/gamification/store';
import { ITEM_TYPE_LABELS, type CreateListingFormData } from './types';

export function CreateListingSection() {
  const { createListing, isCreating, getPriceRecommendation } = useMarketplaceStore();

  const [formData, setFormData] = useState<CreateListingFormData>({
    itemType: '',
    itemId: '',
    price: 0,
    currency: 'coins',
    acceptsTrades: false,
  });

  const recommendation = formData.itemType ? getPriceRecommendation('rare') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemType || !formData.itemId || !formData.price) {
      return;
    }

    const result = await createListing({
      itemType: formData.itemType,
      itemId: formData.itemId,
      price: formData.price,
      currency: formData.currency,
      acceptsTrades: formData.acceptsTrades,
    });

    if (result.success) {
      setFormData({
        itemType: '',
        itemId: '',
        price: 0,
        currency: 'coins',
        acceptsTrades: false,
      });
      // Show success notification
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-6 text-2xl font-bold">Create New Listing</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">Item Type</label>
            <select
              value={formData.itemType}
              onChange={(e) => setFormData({ ...formData, itemType: e.target.value as ItemType })} // type assertion: select value constrained to ItemType
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white"
              required
            >
              <option value="">Select type...</option>
              {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Item Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">Select Item</label>
            <select
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white"
              required
            >
              <option value="">Select item...</option>
              {/* This would be populated from user's owned tradeable items */}
              <option value="placeholder">Your tradeable items would appear here</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">Price</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="Enter price..."
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white"
                required
                min={1}
              />
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as 'coins' | 'gems' })
                }
                className="rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white"
              >
                <option value="coins">🪙 Coins</option>
                <option value="gems">💎 Gems</option>
              </select>
            </div>
            {recommendation && (
              <p className="mt-2 text-xs text-gray-500">
                Suggested: {recommendation.min.toLocaleString()} —{' '}
                {recommendation.max.toLocaleString()} coins
              </p>
            )}
          </div>

          {/* Accept Trades */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="acceptsTrades"
              checked={formData.acceptsTrades}
              onChange={(e) => setFormData({ ...formData, acceptsTrades: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 bg-black/50"
            />
            <label htmlFor="acceptsTrades" className="text-sm">
              Accept trade offers for this item
            </label>
          </div>

          {/* Fee Notice */}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ A 5% transaction fee will be deducted when your item sells
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || !formData.itemType || !formData.itemId || !formData.price}
            className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 py-4 font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
