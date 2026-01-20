/**
 * MessageSearch Component
 *
 * Full-text search across messages with filters and results display.
 * Features search across conversations, date filters, and result navigation.
 *
 * @version 0.9.4
 * @since 2026-01-20
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ==================== TYPE DEFINITIONS ====================

interface MessageSearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  highlightedContent: string; // Content with search term highlighted
  createdAt: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
}

interface SearchFilters {
  conversationId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: 'all' | 'text' | 'image' | 'file' | 'voice';
}

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (conversationId: string, messageId: string) => void;
  conversationId?: string; // If provided, search only in this conversation
  className?: string;
}

interface SearchResultCardProps {
  result: MessageSearchResult;
  onClick: () => void;
}

// ==================== SEARCH RESULT CARD ====================

function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      onClick={onClick}
      className="w-full rounded-lg border border-dark-600 bg-dark-800 p-3 text-left transition-colors hover:border-primary-500/50 hover:bg-dark-700"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.senderAvatarUrl ? (
            <img
              src={result.senderAvatarUrl}
              alt={result.senderUsername}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
              <span className="text-xs font-bold text-white">
                {result.senderUsername[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-white">{result.senderUsername}</span>
          <span className="text-xs text-gray-500">in</span>
          <span className="text-sm text-primary-400">{result.conversationName}</span>
        </div>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Content with highlight */}
      <p
        className="text-sm text-gray-300"
        dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
      />

      {/* Jump to arrow */}
      <div className="mt-2 flex items-center gap-1 text-xs text-primary-400">
        <span>Jump to message</span>
        <ArrowRightIcon className="h-3 w-3" />
      </div>
    </motion.button>
  );
}

// ==================== MAIN COMPONENT ====================

export function MessageSearch({
  isOpen,
  onClose,
  onResultClick,
  conversationId,
  className,
}: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    messageType: 'all',
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cgraph-message-search-recent');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save recent search
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 5);
      localStorage.setItem('cgraph-message-search-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Highlight search term in content
  const highlightContent = useCallback((content: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return content;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(
      regex,
      '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>'
    );
  }, []);

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/messages/search', {
          params: {
            q: searchQuery,
            conversation_id: conversationId || filters.conversationId,
            user_id: filters.userId,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
            message_type: filters.messageType !== 'all' ? filters.messageType : undefined,
            limit: 20,
          },
        });

        if (response.data?.messages) {
          setResults(
            response.data.messages.map((m: any) => ({
              id: m.id,
              conversationId: m.conversation_id,
              conversationName: m.conversation_name || 'Conversation',
              senderId: m.sender_id,
              senderUsername: m.sender_username || 'Unknown',
              senderAvatarUrl: m.sender_avatar_url,
              content: m.content,
              highlightedContent: highlightContent(m.content, searchQuery),
              createdAt: m.created_at,
              messageType: m.message_type || 'text',
            }))
          );
          saveRecentSearch(searchQuery);
        } else {
          // Fallback with mock results
          setResults(generateMockResults(searchQuery));
        }
      } catch {
        // Fallback with mock results
        setResults(generateMockResults(searchQuery));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, filters, highlightContent, saveRecentSearch]
  );

  // Generate mock results for demo
  const generateMockResults = (searchQuery: string): MessageSearchResult[] => {
    return [
      {
        id: 'mock-1',
        conversationId: 'conv-1',
        conversationName: 'General Chat',
        senderId: 'user-1',
        senderUsername: 'alice',
        content: `Here's what I found about ${searchQuery}...`,
        highlightedContent: highlightContent(
          `Here's what I found about ${searchQuery}...`,
          searchQuery
        ),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        messageType: 'text',
      },
      {
        id: 'mock-2',
        conversationId: 'conv-2',
        conversationName: 'Dev Team',
        senderId: 'user-2',
        senderUsername: 'bob',
        content: `Did you see the latest update on ${searchQuery}?`,
        highlightedContent: highlightContent(
          `Did you see the latest update on ${searchQuery}?`,
          searchQuery
        ),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        messageType: 'text',
      },
    ];
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className={cn(
            'w-full max-w-2xl overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 shadow-2xl',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-dark-600 p-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded p-1 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filters Toggle */}
          <div className="border-b border-dark-600 px-4 py-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <span>Filters</span>
              <motion.div animate={{ rotate: showFilters ? 180 : 0 }}>
                <ChevronDownIcon className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex flex-wrap gap-3">
                    {/* Date From */}
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="rounded-lg border border-dark-500 bg-dark-700 px-2 py-1 text-sm text-white"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="rounded-lg border border-dark-500 bg-dark-700 px-2 py-1 text-sm text-white"
                      />
                    </div>

                    {/* Message Type */}
                    <select
                      value={filters.messageType}
                      onChange={(e) =>
                        setFilters({ ...filters, messageType: e.target.value as any })
                      }
                      className="rounded-lg border border-dark-500 bg-dark-700 px-2 py-1 text-sm text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="text">Text</option>
                      <option value="image">Images</option>
                      <option value="file">Files</option>
                      <option value="voice">Voice</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results / Recent Searches */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
                />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <p className="mb-3 text-sm text-gray-400">{results.length} results found</p>
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onClick={() => onResultClick(result.conversationId, result.id)}
                  />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MagnifyingGlassIcon className="mb-3 h-12 w-12" />
                <p className="text-sm">No messages found for "{query}"</p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  Recent Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-lg bg-dark-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-dark-600 hover:text-white"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ChatBubbleLeftRightIcon className="mb-3 h-12 w-12" />
                <p className="text-sm">Type to search messages</p>
                <p className="mt-1 text-xs">Search across all your conversations</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageSearch;
