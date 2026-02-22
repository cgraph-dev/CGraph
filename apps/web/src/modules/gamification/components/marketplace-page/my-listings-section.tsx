import { useEffect } from 'react';
import { useMarketplaceStore } from '@/modules/gamification/store';
import { ITEM_TYPE_LABELS } from './types';

export function MyListingsSection() {
  const { myListings, fetchMyListings, cancelListing, updateListing } = useMarketplaceStore();
  void updateListing; // Reserved for future edit functionality

  useEffect(() => {
    fetchMyListings('active');
  }, [fetchMyListings]);

  const handleCancel = async (listingId: string) => {
    if (confirm('Are you sure you want to cancel this listing?')) {
      await cancelListing(listingId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Active Listings</h2>
        <span className="text-sm text-gray-500">{myListings.length} listings</span>
      </div>

      {myListings.length > 0 ? (
        <div className="space-y-4">
          {myListings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              {/* Preview */}
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-black/30">
                {listing.itemPreviewUrl ? (
                  <img src={listing.itemPreviewUrl} alt="" className="h-12 w-12 object-contain" />
                ) : (
                  <span className="text-2xl opacity-50">🎨</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-medium">{listing.itemName}</h3>
                <p className="text-sm text-gray-500">{ITEM_TYPE_LABELS[listing.itemType]}</p>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-bold text-yellow-400">{listing.price.toLocaleString()} 🪙</p>
                <p className="text-xs text-gray-500">
                  Listed {new Date(listing.listedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancel(listing.id)}
                  className="rounded-lg px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 py-16 text-center">
          <div className="mb-4 text-4xl">📦</div>
          <h3 className="mb-2 text-xl font-medium">No active listings</h3>
          <p className="text-gray-500">Create a listing to start selling</p>
        </div>
      )}
    </div>
  );
}
