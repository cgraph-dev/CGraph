/**
 * SearchScreen Components
 *
 * @module screens/search/SearchScreen/components
 */

export {
  SkeletonLoader,
  TrendingItem,
  VoiceSearchButton,
  AnimatedResultItem,
  FilterModal,
  defaultFilters,
} from './search-components';

export type { SearchFilters } from './search-components';

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
