/**
 * Message Search Types
 *
 * Type definitions for the message search module
 */

import type { RefObject } from 'react';

/**
 * Individual search result
 */
export interface MessageSearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  highlightedContent: string;
  createdAt: string;
  messageType: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  conversationId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: string;
}

/**
 * Props for the main MessageSearch component
 */
export interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick?: (conversationId: string, messageId: string) => void;
  conversationId?: string;
  className?: string;
}

/**
 * Props for SearchResultCard sub-component
 */
export interface SearchResultCardProps {
  result: MessageSearchResult;
  onJumpToMessage: (conversationId: string, messageId: string) => void;
}

/**
 * Props for SearchFiltersPanel sub-component
 */
export interface SearchFiltersPanelProps {
  filters: SearchFilters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFiltersChange: (filters: SearchFilters) => void;
}

/**
 * Props for SearchHeader sub-component
 */
export interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Props for SearchResults sub-component
 */
export interface SearchResultsProps {
  isLoading: boolean;
  searchQuery: string;
  results: MessageSearchResult[];
  recentSearches: string[];
  onJumpToMessage: (conversationId: string, messageId: string) => void;
  onRecentSearchClick: (term: string) => void;
}
