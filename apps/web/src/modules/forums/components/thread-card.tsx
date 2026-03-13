/**
 * Thread Card — Rich thread preview card for forum browsing
 *
 * Features:
 * - Author avatar + username + timestamp + tag pills
 * - Title (bold, 1-2 lines, linked)
 * - Preview text (first 2-3 lines, truncated)
 * - Image thumbnail if thread contains images
 * - Bottom bar: votes, reply count, view count, last active
 * - Hover: elevated shadow, border glow
 * - Pinned/locked/hot indicators
 *
 * @module modules/forums/components/thread-card
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftIcon,
  EyeIcon,
  MapPinIcon,
  LockClosedIcon,
  FireIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ThreadTag {
  id: string;
  label: string;
  color: string;
}

interface ThreadCardData {
  id: string;
  title: string;
  preview?: string;
  thumbnailUrl?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  tags?: ThreadTag[];
  voteCount: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  lastActiveAt?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isHot?: boolean;
  userVote?: 'up' | 'down' | null;
  /** Content gating (Phase 31 — Discovery) */
  isContentGated?: boolean;
  gatePriceNodes?: number;
}

interface ThreadCardProps {
  thread: ThreadCardData;
  /** Compact mode for list view */
  compact?: boolean;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
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
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Compact Row (List View) ────────────────────────────────────────────

function CompactThreadRow({ thread, className }: { thread: ThreadCardData; className?: string }) {
  return (
    <Link to={`/forums/threads/${thread.id}`} className={cn('block', className)}>
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      >
        {/* Vote count pill */}
        <div
          className={cn(
            'flex h-8 min-w-[44px] flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold',
            thread.userVote === 'up' && 'bg-primary-600/20 text-primary-400',
            thread.userVote === 'down' && 'bg-red-500/20 text-red-400',
            !thread.userVote && 'bg-white/[0.04] text-gray-400'
          )}
        >
          {formatCount(thread.voteCount)}
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {thread.isPinned && (
              <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-primary-400" />
            )}
            {thread.isLocked && (
              <LockClosedIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
            )}
            {thread.isHot && <FireIcon className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />}
            <span className="truncate text-sm font-medium text-gray-200">{thread.title}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
            <span>{thread.author.displayName}</span>
            <span>·</span>
            <span>{formatRelativeTime(thread.createdAt)}</span>
            {thread.tags && thread.tags.length > 0 && (
              <>
                <span>·</span>
                {thread.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            <span>{formatCount(thread.replyCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            <span>{formatCount(thread.viewCount)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Full Card (Grid View) ──────────────────────────────────────────────

/** Description. */
/** Thread Card component. */
export function ThreadCard({ thread, compact = false, className }: ThreadCardProps) {
  if (compact) {
    return <CompactThreadRow thread={thread} className={className} />;
  }

  return (
    <Link to={`/forums/threads/${thread.id}`} className={cn('block', className)}>
      <motion.article
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}
        transition={springs.snappy}
        className={cn(
          'group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04] p-4',
          'transition-colors hover:border-white/[0.12]',
          thread.isPinned && 'border-l-2 border-l-primary-500'
        )}
      >
        {/* Author row */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
            {thread.author.avatarUrl ? (
              <img src={thread.author.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold text-gray-400">
                {thread.author.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-300">{thread.author.displayName}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500">{formatRelativeTime(thread.createdAt)}</span>

          {/* Status icons */}
          <div className="ml-auto flex items-center gap-1">
            {thread.isPinned && <MapPinIcon className="h-3.5 w-3.5 text-primary-400" />}
            {thread.isLocked && <LockClosedIcon className="h-3.5 w-3.5 text-gray-500" />}
            {thread.isHot && <FireIcon className="h-3.5 w-3.5 text-orange-400" />}
            {thread.isContentGated && (
              <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                <LockClosedIcon className="h-3 w-3" />
                {thread.gatePriceNodes != null ? `${thread.gatePriceNodes} Nodes` : 'Gated'}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {thread.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-sm font-bold text-white group-hover:text-primary-300">
          {thread.title}
        </h3>

        {/* Preview body + optional thumbnail */}
        <div className="mt-1.5 flex gap-3">
          <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-gray-400">
            {thread.preview}
          </p>
          {thread.thumbnailUrl && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={thread.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Bottom stats bar */}
        <div className="mt-3 flex items-center gap-4 border-t border-white/[0.04] pt-2.5 text-[11px] text-gray-500">
          {/* Votes */}
          <div
            className={cn(
              'flex items-center gap-1 font-medium',
              thread.userVote === 'up' && 'text-primary-400',
              thread.userVote === 'down' && 'text-red-400'
            )}
          >
            <span>▲</span>
            <span>{formatCount(thread.voteCount)}</span>
          </div>

          {/* Replies */}
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            <span>{thread.replyCount} replies</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            <span>{formatCount(thread.viewCount)}</span>
          </div>

          {/* Last active */}
          {thread.lastActiveAt && (
            <div className="ml-auto flex items-center gap-1 text-gray-600">
              <ClockIcon className="h-3 w-3" />
              <span>{formatRelativeTime(thread.lastActiveAt)}</span>
            </div>
          )}
        </div>
      </motion.article>
    </Link>
  );
}

export default ThreadCard;
