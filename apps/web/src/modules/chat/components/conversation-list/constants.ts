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

// Mock users for NewChatModal - would come from API in production
export const MOCK_USERS = [
  { id: '1', username: 'alice', displayName: 'Alice', avatarUrl: null, status: 'online' as const },
  { id: '2', username: 'bob', displayName: 'Bob', avatarUrl: null, status: 'offline' as const },
  {
    id: '3',
    username: 'charlie',
    displayName: 'Charlie',
    avatarUrl: null,
    status: 'online' as const,
  },
];
