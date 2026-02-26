/**
 * Constants and types for search screen.
 * @module screens/search/search-screen/constants
 */
import { Ionicons } from '@expo/vector-icons';

export const RECENT_SEARCHES_KEY = '@cgraph_recent_searches';
export const MAX_RECENT_SEARCHES = 10;

export type SearchCategory = 'all' | 'users' | 'groups' | 'forums';

export interface CategoryConfig {
  id: SearchCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

export const categories: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: 'search', gradient: ['#3b82f6', '#8b5cf6'] },
  { id: 'users', label: 'Users', icon: 'person', gradient: ['#10b981', '#059669'] },
  { id: 'groups', label: 'Groups', icon: 'people', gradient: ['#f59e0b', '#f97316'] },
  { id: 'forums', label: 'Forums', icon: 'newspaper', gradient: ['#ec4899', '#f43f5e'] },
];
