/**
 * Marketplace page type definitions.
 * @module
 */
import type { ItemType, MarketplaceListing } from '@/modules/gamification/store';

export type MarketplaceTab = 'browse' | 'my-listings' | 'history' | 'create';

export interface ListingCardProps {
  listing: MarketplaceListing;
  onClick: () => void;
}

export interface ListingDetailModalProps {
  listing: MarketplaceListing;
  onClose: () => void;
}

export interface CreateListingFormData {
  itemType: ItemType | '';
  itemId: string;
  price: number;
  currency: 'coins' | 'gems';
  acceptsTrades: boolean;
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  avatar_border: '🎨 Avatar Border',
  profile_theme: '🖼️ Profile Theme',
  chat_effect: '✨ Chat Effect',
  title: '🏷️ Title',
  badge: '🏅 Badge',
};

export const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500',
  mythic: 'bg-pink-500',
  unique: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
};
