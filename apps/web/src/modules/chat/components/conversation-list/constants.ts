/**
 * ConversationList constants
 * @module modules/chat/components/conversation-list
 */

import type { FilterOption } from './types';

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'Direct' },
  { id: 'group', label: 'Groups' },
  { id: 'unread', label: 'Unread' },
];

// User search now uses GET /api/v1/users/search

