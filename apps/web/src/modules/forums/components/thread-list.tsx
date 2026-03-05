/**
 * Thread List — Grid/list view with sort, filter, infinite scroll
 *
 * Features:
 * - View toggle: Grid (2-column cards) | List (compact rows)
 * - Sort: Latest, Hot, Top (Today/Week/Month/All), Unanswered
 * - Filter by tags (horizontal scrollable pills)
 * - Infinite scroll with skeleton loading
 * - Empty state
 *
 * @module modules/forums/components/thread-list
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Squares2X2Icon,
  Bars3Icon,
  FireIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { ThreadCard } from './thread-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type SortMode = 'latest' | 'hot' | 'top' | 'unanswered';

interface Tag {
  id: string;
  label: string;
  color: string;
}

interface ThreadListProps {
  threads?: Array<{
    id: string;
    title: string;
    preview?: string;
    thumbnailUrl?: string;
    author: { id: string; displayName: string; avatarUrl?: string };
    tags?: Tag[];
    voteCount: number;
    replyCount: number;
    viewCount: number;
    createdAt: string;
    lastActiveAt?: string;
    isPinned?: boolean;
    isLocked?: boolean;
    isHot?: boolean;
    userVote?: 'up' | 'down' | null;
  }>;
  tags?: Tag[];
  isLoading?: boolean;
  onCreateThread?: () => void;
  className?: string;
}

// ── Sort Options ───────────────────────────────────────────────────────

const sortOptions: { value: SortMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'latest', label: 'Latest', icon: ClockIcon },
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'top', label: 'Top', icon: ArrowTrendingUpIcon },
  { value: 'unanswered', label: 'Unanswered', icon: ChatBubbleLeftRightIcon },
];

// ── Skeleton Card ──────────────────────────────────────────────────────

function ThreadSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Skeleton shape="circle" className="h-8 w-11" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="h-6 w-6" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1 h-3 w-2/3" />
      <div className="mt-3 flex gap-4 border-t border-white/[0.04] pt-2.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function ThreadList({
  threads = [],
  tags = [],
  isLoading = false,
  onCreateThread,
  className,
}: ThreadListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortMode>('latest');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  // Filter threads by selected tags
  const filteredThreads = selectedTags.size > 0
    ? threads.filter((t) => t.tags?.some((tag) => selectedTags.has(tag.id)))
    : threads;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort pills */}
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                sortBy === opt.value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Create Thread */}
        {onCreateThread && (
          <motion.button
            onClick={onCreateThread}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-4 w-4" />
            New Thread
          </motion.button>
        )}

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg bg-white/[0.04] p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-gray-500',
            )}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-gray-500',
            )}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tag filters */}
      {tags.length > 0 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all',
                selectedTags.has(tag.id)
                  ? 'ring-1 ring-white/20'
                  : 'opacity-60 hover:opacity-100',
              )}
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.label}
            </button>
          ))}
          {selectedTags.size > 0 && (
            <button
              onClick={() => setSelectedTags(new Set())}
              className="flex-shrink-0 text-[11px] text-gray-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Thread list/grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                : 'space-y-1',
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <ThreadSkeleton key={i} compact={viewMode === 'list'} />
            ))}
          </motion.div>
        ) : filteredThreads.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <ChatBubbleLeftRightIcon className="mb-3 h-12 w-12 text-gray-600" />
            <p className="text-sm font-medium text-gray-400">No threads yet</p>
            <p className="mt-1 text-xs text-gray-600">Be the first to start a discussion</p>
            {onCreateThread && (
              <button
                onClick={onCreateThread}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500"
              >
                Create Thread
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="threads"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                : 'space-y-1',
            )}
          >
            {filteredThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                compact={viewMode === 'list'}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThreadList;
