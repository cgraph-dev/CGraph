/**
 * SearchResultItem — Single message result in conversation search.
 *
 * Shows sender avatar, name, highlighted snippet, timestamp, and jump action.
 *
 * @module modules/search/components/in-conversation-search/search-result-item
 */

import React, { useCallback } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { SearchMessageResult } from '../../hooks/useConversationSearch';

interface SearchResultItemProps {
  message: SearchMessageResult;
  query: string;
  onJumpTo: (messageId: string) => void;
}

/**
 * A single search result displaying message info with highlighted match.
 */
export function SearchResultItem({ message, query, onJumpTo }: SearchResultItemProps) {
  const handleJump = useCallback(() => {
    onJumpTo(message.id);
  }, [message.id, onJumpTo]);

  const senderName =
    message.sender?.display_name || message.sender?.username || 'Unknown';
  const timestamp = new Date(message.inserted_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={handleJump}
      className="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]"
    >
      {/* Sender avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-medium text-gray-300">
        {message.sender?.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={senderName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          senderName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{senderName}</span>
          <span className="text-[10px] text-gray-500">{timestamp}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {highlightMatch(message.content || '', query)}
        </p>
      </div>

      {/* Jump action */}
      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/** Highlight matching substrings in text */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;

  // Show context around match
  const contextStart = Math.max(0, idx - 40);
  const contextEnd = Math.min(text.length, idx + query.length + 60);
  const snippet =
    (contextStart > 0 ? '...' : '') +
    text.slice(contextStart, contextEnd) +
    (contextEnd < text.length ? '...' : '');

  const localIdx = snippet.toLowerCase().indexOf(query.toLowerCase());
  if (localIdx === -1) return snippet;

  return (
    <>
      {snippet.slice(0, localIdx)}
      <span className="font-medium text-primary-400">
        {snippet.slice(localIdx, localIdx + query.length)}
      </span>
      {snippet.slice(localIdx + query.length)}
    </>
  );
}
