/**
 * Feed Post Card — Individual post card for the discovery feed
 *
 * Displays thread title, preview, author, community badge, metrics,
 * and content gating indicator.
 *
 * @module pages/feed/feed-post-card
 */

import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftIcon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PulseReactions } from '@/modules/pulse/components/pulse-reactions';
import type { FeedThread } from '@/modules/discovery/hooks/useFeed';

interface FeedPostCardProps {
  thread: FeedThread;
  className?: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function FeedPostCard({ thread, className }: FeedPostCardProps) {
  return (
    <Link
      to={`/forums/threads/${thread.id}`}
      className={cn(
        'block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/8',
        className
      )}
    >
      {/* Header: author + community + time */}
      <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
        {thread.author && (
          <span className="font-medium text-white/60">{thread.author.username}</span>
        )}
        {thread.board && (
          <>
            <span>in</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white/60">
              {thread.board.name}
            </span>
          </>
        )}
        <span className="ml-auto">{formatRelativeTime(thread.created_at)}</span>
      </div>

      {/* Title */}
      <div className="mb-1.5 flex items-start gap-2">
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-white/90">
          {thread.title}
        </h3>
        {thread.is_content_gated && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
            <LockClosedIcon className="h-3 w-3" />
            {thread.gate_price_nodes != null
              ? `${thread.gate_price_nodes} Nodes`
              : 'Gated'}
          </span>
        )}
      </div>

      {/* Preview text */}
      {thread.content_preview && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-white/40">
          {thread.content_preview}
        </p>
      )}

      {/* Bottom bar: metrics + reactions */}
      <div className="flex items-center gap-4 text-xs text-white/30">
        <span className="flex items-center gap-1">
          <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
          {formatCount(thread.reply_count)}
        </span>
        <span className="flex items-center gap-1">
          <EyeIcon className="h-3.5 w-3.5" />
          {formatCount(thread.view_count)}
        </span>
        {thread.score > 0 && (
          <span className="font-medium text-indigo-400/60">
            ↑ {formatCount(thread.score)}
          </span>
        )}
        {thread.author && thread.board && (
          <div
            className="ml-auto"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
            role="group"
          >
            <PulseReactions
              contentId={thread.id}
              contentType="thread"
              authorId={thread.author.id}
              forumId={thread.board.id}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default FeedPostCard;
