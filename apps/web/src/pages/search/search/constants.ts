/**
 * Constants for Search page
 * @module pages/search/search/constants
 */

import {
  MagnifyingGlassIcon,
  UserIcon,
  UserGroupIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { CategoryDefinition } from './types';

/**
 * Search category definitions with icons and labels
 */
export const categories: CategoryDefinition[] = [
  { id: 'all', label: 'All', icon: MagnifyingGlassIcon },
  { id: 'users', label: 'Users', icon: UserIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
  { id: 'forums', label: 'Forums', icon: NewspaperIcon },
  { id: 'posts', label: 'Posts', icon: DocumentTextIcon },
  { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
];
