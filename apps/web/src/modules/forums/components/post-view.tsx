/**
 * Post View — Full thread post with author info, votes, actions, replies
 *
 * Features:
 * - Thread title (large, bold)
 * - Author info: avatar + name + role badges + date
 * - Post content rendered
 * - Vote buttons at left (vertical)
 * - Action bar: Reply, Quote, Share, Bookmark, Report
 * - Reply chain with indent (2 levels max)
 * - "Best answer" highlight
 *
 * @module modules/forums/components/post-view
 */

import { motion } from 'motion/react';
import {
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  FlagIcon,
  ArrowUturnLeftIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { VoteButton } from './vote-button';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface Author {
  id: string;
  displayName: string;
  avatarUrl?: string;
  roleBadges?: Array<{ name: string; color: string }>;
}

interface Reply {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  isBestAnswer?: boolean;
  replies?: Reply[];
}

interface PostViewProps {
  title: string;
  author: Author;
  content: string;
  createdAt: string;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  isBookmarked?: boolean;
  replies?: Reply[];
  className?: string;
  onReply?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onReport?: () => void;
  onVote?: (direction: 'up' | 'down' | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── Action Button ──────────────────────────────────────────────────────

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
        active ? 'text-primary-400' : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.button>
  );
}

// ── Reply Component ────────────────────────────────────────────────────

function ReplyItem({ reply, depth = 0 }: { reply: Reply; depth?: number }) {
  const maxDepth = 2;

  return (
    <div
      className={cn(
        'border-l-2 pl-4 pt-4',
        reply.isBestAnswer ? 'border-l-green-500' : 'border-l-white/[0.06]',
        depth > 0 && 'ml-4',
      )}
    >
      {/* Best answer badge */}
      {reply.isBestAnswer && (
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-green-400">
          <CheckBadgeIcon className="h-4 w-4" />
          Best Answer
        </div>
      )}

      <div className="flex gap-3">
        {/* Votes */}
        <VoteButton count={reply.voteCount} userVote={reply.userVote} size="sm" />

        <div className="flex-1">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              {reply.author.avatarUrl ? (
                <img src={reply.author.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-gray-400">
                  {reply.author.displayName.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-300">{reply.author.displayName}</span>
            <span className="text-[10px] text-gray-600">{formatDate(reply.createdAt)}</span>
          </div>

          {/* Content */}
          <div className="mt-1.5 text-sm leading-relaxed text-gray-300">{reply.content}</div>

          {/* Actions */}
          <div className="mt-1.5 flex items-center gap-1">
            <ActionBtn icon={ArrowUturnLeftIcon} label="Reply" />
            <ActionBtn icon={ChatBubbleLeftIcon} label="Quote" />
          </div>

          {/* Nested replies */}
          {depth < maxDepth && reply.replies?.map((nested) => (
            <ReplyItem key={nested.id} reply={nested} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function PostView({
  title,
  author,
  content,
  createdAt,
  voteCount,
  userVote,
  isBookmarked = false,
  replies = [],
  className,
  onReply,
  onShare,
  onBookmark,
  onReport,
  onVote,
}: PostViewProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Main post */}
      <article className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <div className="p-5">
          {/* Title */}
          <h1 className="text-xl font-bold text-white">{title}</h1>

          {/* Author info */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-400">
                  {author.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">{author.displayName}</span>
                {author.roleBadges?.map((badge) => (
                  <span
                    key={badge.name}
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                    style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                  >
                    {badge.name}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-gray-500">{formatDate(createdAt)}</span>
            </div>
          </div>

          {/* Content + sidebar votes */}
          <div className="mt-4 flex gap-4">
            <VoteButton count={voteCount} userVote={userVote} onVote={onVote} />
            <div className="flex-1 text-sm leading-relaxed text-gray-300">{content}</div>
          </div>

          {/* Action bar */}
          <div className="mt-4 flex items-center gap-1 border-t border-white/[0.04] pt-3">
            <ActionBtn icon={ArrowUturnLeftIcon} label="Reply" onClick={onReply} />
            <ActionBtn icon={ChatBubbleLeftIcon} label="Quote" />
            <ActionBtn icon={ShareIcon} label="Share" onClick={onShare} />
            <ActionBtn
              icon={isBookmarked ? BookmarkSolidIcon : BookmarkIcon}
              label="Bookmark"
              onClick={onBookmark}
              active={isBookmarked}
            />
            <div className="flex-1" />
            <ActionBtn icon={FlagIcon} label="Report" onClick={onReport} />
          </div>
        </div>
      </article>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <h3 className="mb-4 text-sm font-bold text-gray-300">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h3>
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PostView;
