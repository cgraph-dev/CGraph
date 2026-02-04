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
} from './SearchComponents';

export type { SearchFilters } from './SearchComponents';

// Result item components
export { UserResultItem, GroupResultItem, ForumResultItem } from './ResultItems';

export type { SearchUser, SearchGroup, SearchForum } from './ResultItems';

// Discovery section components
export {
  DiscoverySection,
  RecentSearchesSection,
  TrendingSection,
  QuickActionsSection,
  SearchTips,
} from './DiscoverySection';
