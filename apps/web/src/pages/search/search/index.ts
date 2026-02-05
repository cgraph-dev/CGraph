/**
 * Search module barrel exports
 * @module pages/search/search
 */

// Main component
export { Search, Search as default } from './page';

// Result components
export {
  ResultSection,
  UserResult,
  GroupResult,
  ForumResult,
  PostResult,
  MessageResult,
} from './result-components';

// Types
export type {
  CategoryDefinition,
  ResultSectionProps,
  UserResultProps,
  GroupResultProps,
  ForumResultProps,
  PostResultProps,
  MessageResultProps,
  IdSearchType,
} from './types';

// Constants
export { categories } from './constants';
