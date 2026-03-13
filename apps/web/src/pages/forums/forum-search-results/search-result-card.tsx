/**
 * Search Result Card
 *
 * Displays a single forum search result with type badge,
 * title, content preview, author info, and metadata.
 *
 * @module pages/forums/forum-search-results/search-result-card
 */

import type { ForumSearchResult } from '@/modules/forums/store/forumStore.types';
import { Link } from 'react-router-dom';

const TYPE_BADGE_STYLES: Record<
  ForumSearchResult['type'],
  { bg: string; text: string; label: string }
> = {
  thread: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Thread' },
  post: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Post' },
  comment: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Comment' },
};

function highlightText(text: string, highlights?: string[]): React.ReactNode {
  if (!highlights?.length) return text;
  let result = text;
  for (const h of highlights) {
    result = result.replace(
      new RegExp(`(${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      '**$1**'
    );
  }
  const parts = result.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-yellow-500/30 px-0.5 text-yellow-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface SearchResultCardProps {
  result: ForumSearchResult;
}

/** Description. */
/** Search Result Card component. */
export function SearchResultCard({ result }: SearchResultCardProps) {
  const badge = TYPE_BADGE_STYLES[result.type];
  const preview =
    result.contentPreview.length > 200
      ? result.contentPreview.slice(0, 200) + '…'
      : result.contentPreview;

  const linkTo =
    result.type === 'thread' || result.type === 'post'
      ? `/forums/${result.forum.slug}/post/${result.id}`
      : `/forums/${result.forum.slug}/post/${result.id}`;

  return (
    <Link
      to={linkTo}
      className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start gap-3">
        {/* Type Badge */}
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>

        <div className="min-w-0 flex-1">
          {/* Title */}
          {result.title && (
            <h3 className="mb-1 truncate text-sm font-semibold text-white">
              {highlightText(result.title, result.highlights)}
            </h3>
          )}

          {/* Content Preview */}
          <p className="mb-2 text-sm leading-relaxed text-gray-400">
            {highlightText(preview, result.highlights)}
          </p>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {/* Author */}
            <div className="flex items-center gap-1.5">
              {result.author.avatar ? (
                <img src={result.author.avatar} alt="" className="h-4 w-4 rounded-full" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-gray-600" />
              )}
              <span>{result.author.username}</span>
            </div>

            {/* Forum */}
            <span className="text-gray-600">in</span>
            <span className="text-blue-400">{result.forum.name}</span>

            {/* Board */}
            {result.board && (
              <>
                <span className="text-gray-600">›</span>
                <span>{result.board.name}</span>
              </>
            )}

            {/* Score */}
            <span className="ml-auto tabular-nums">
              {result.score > 0 ? '+' : ''}
              {result.score} pts
            </span>

            {/* Timestamp */}
            <span>{formatRelativeTime(result.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default SearchResultCard;
