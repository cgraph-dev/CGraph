/**
 * MarketplacePage - Modularized
 *
 * This file has been refactored into smaller, focused modules.
 * See ./marketplace-page/ for the individual components:
 *
 * - types.ts - Type definitions and constants
 * - MarketplaceStats.tsx - Stats display component
 * - ListingCard.tsx - Individual listing card
 * - ListingDetailModal.tsx - Listing detail/purchase modal
 * - BrowseSection.tsx - Browse listings with filters
 * - MyListingsSection.tsx - User's active listings
 * - HistorySection.tsx - Transaction history
 * - CreateListingSection.tsx - Create new listing form
 * - MarketplacePage.tsx - Main page component
 *
 * @module gamification/MarketplacePage
 */

export {
  MarketplacePage,
  MarketplaceStats,
  ListingCard,
  ListingDetailModal,
  BrowseSection,
  MyListingsSection,
  HistorySection,
  CreateListingSection,
  ITEM_TYPE_LABELS,
  RARITY_COLORS,
} from './marketplace-page/index';

export type {
  MarketplaceTab,
  ListingCardProps,
  ListingDetailModalProps,
  CreateListingFormData,
} from './marketplace-page/index';

export { default } from './marketplace-page/index';
