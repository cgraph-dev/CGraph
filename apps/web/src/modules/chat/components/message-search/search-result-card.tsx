/**
 * SearchResultCard Component
 *
 * Displays a single search result with highlighted content
 */

import { memo } from 'react';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { SearchResultCardProps } from './types';

/**
 * Search result card with avatar, highlighted content, and jump link
 */
export const SearchResultCard = memo<SearchResultCardProps>(function SearchResultCard({
  result,
  onJumpToMessage,
}) {
  return (
    <div className="group cursor-pointer rounded-lg p-3 transition-colors hover:bg-white/5">
      <div className="flex items-start space-x-3">
        <ThemedAvatar src={result.senderAvatarUrl} alt={result.senderUsername} size="small" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">{result.senderUsername}</span>
            <span className="text-xs text-white/40">
              {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p
            className="line-clamp-2 text-sm text-white/70"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(result.highlightedContent),
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-white/40">in {result.conversationName}</span>
            <button
              onClick={() => onJumpToMessage(result.conversationId, result.id)}
              className="text-accent-400 text-xs opacity-0 transition-opacity hover:underline group-hover:opacity-100"
            >
              Jump to message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SearchResultCard;
