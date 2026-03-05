/**
 * Search Result Item — Shared component for rendering search results
 *
 * Variants: message, user, channel, thread
 * Shows match highlighting, avatars, metadata
 *
 * @module shared/components/search-result-item
 */

import React from 'react';
import {
  ChatBubbleLeftIcon,
  UserIcon,
  HashtagIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

// ── Types ──────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'channel' | 'thread';
  title: string;
  subtitle?: string;
  body?: string;
  avatar?: string;
  timestamp?: string;
  channelName?: string;
  matchCount?: number;
  hasAttachment?: boolean;
  mutualFriends?: number;
  voteCount?: number;
  onClick?: () => void;
}

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
}

// ── Highlight ──────────────────────────────────────────────────────────

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary-500/30 text-primary-300 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

// ── Type Icons ─────────────────────────────────────────────────────────

const typeIcons: Record<string, React.ReactNode> = {
  message: <ChatBubbleLeftIcon className="h-4 w-4" />,
  user: <UserIcon className="h-4 w-4" />,
  channel: <HashtagIcon className="h-4 w-4" />,
  thread: <DocumentTextIcon className="h-4 w-4" />,
};

// ── Component ──────────────────────────────────────────────────────────

export function SearchResultItem({ result, query }: SearchResultItemProps) {
  return (
    <button
      onClick={result.onClick}
      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
    >
      {/* Avatar or icon */}
      {result.avatar ? (
        <img
          src={result.avatar}
          alt=""
          className="h-9 w-9 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 text-white/30">
          {typeIcons[result.type]}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/80 truncate">
            {highlight(result.title, query)}
          </p>
          {result.timestamp && (
            <span className="text-[10px] text-white/20 shrink-0">{result.timestamp}</span>
          )}
        </div>

        {result.subtitle && (
          <p className="text-xs text-white/30 truncate mt-0.5">{result.subtitle}</p>
        )}

        {result.body && (
          <p className="text-xs text-white/40 line-clamp-2 mt-1 leading-relaxed">
            {highlight(result.body, query)}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-3 mt-1">
          {result.channelName && (
            <span className="text-[10px] text-white/20 flex items-center gap-0.5">
              <HashtagIcon className="h-3 w-3" />
              {result.channelName}
            </span>
          )}
          {result.hasAttachment && (
            <span className="text-[10px] text-white/20 flex items-center gap-0.5">
              <PaperClipIcon className="h-3 w-3" />
              Attachment
            </span>
          )}
          {result.type === 'user' && result.mutualFriends != null && result.mutualFriends > 0 && (
            <span className="text-[10px] text-white/20">
              {result.mutualFriends} mutual friend{result.mutualFriends !== 1 ? 's' : ''}
            </span>
          )}
          {result.type === 'thread' && result.voteCount != null && (
            <span className="text-[10px] text-white/20">
              {result.voteCount} votes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default SearchResultItem;
