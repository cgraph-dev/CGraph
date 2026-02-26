/**
 * SearchScreen Components
 *
 * @module screens/search/SearchScreen/components
 */

export { SkeletonLoader } from './skeleton-loader';
export { TrendingItem } from './trending-item';
export { VoiceSearchButton } from './voice-search-button';
export { AnimatedResultItem } from './animated-result-item';
export { FilterModal } from './filter-modal';
export { defaultFilters } from './search-types';
export type { SearchFilters } from './search-types';

// Result item components
export { UserResultItem, GroupResultItem, ForumResultItem } from './result-items';

export type { SearchUser, SearchGroup, SearchForum } from './result-items';

// Discovery section components
export {
  DiscoverySection,
  RecentSearchesSection,
  TrendingSection,
  QuickActionsSection,
  SearchTips,
} from './discovery-section';
