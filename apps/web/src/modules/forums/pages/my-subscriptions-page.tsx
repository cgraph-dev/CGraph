/**
 * My Forum Subscriptions Page
 *
 * Discord-style subscriptions management page showing all
 * forum/board/thread subscriptions with filtering and bulk actions.
 *
 * @module modules/forums/pages
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  BellSlashIcon,
  TrashIcon,
  FunnelIcon,
  HashtagIcon,
  ChatBubbleLeftRightIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';
import { api } from '@/lib/api';

interface Subscription {
  id: string;
  notification_level: 'all' | 'mentions' | 'none';
  forum?: { id: string; name: string; slug: string };
  board?: { id: string; name: string; slug: string };
  thread?: { id: string; title: string; slug: string };
  inserted_at: string;
  unread_count?: number;
}

type FilterType = 'all' | 'forums' | 'boards' | 'threads';

/**
 * unknown for the forums module.
 */
/**
 * My Subscriptions Page — route-level page component.
 */
export function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/forum/subscriptions');
      setSubscriptions(res.data?.subscriptions ?? []);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleUnsubscribe = useCallback(async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/api/v1/forum/subscriptions/${id}`);
      setSubscriptions((s) => s.filter((sub) => sub.id !== id));
      toast.success('Unsubscribed');
    } catch {
      toast.error('Failed to unsubscribe');
    } finally {
      setDeleting(null);
    }
  }, []);

  const handleUpdateLevel = useCallback(async (id: string, level: 'all' | 'mentions' | 'none') => {
    try {
      await api.put(`/api/v1/forum/subscriptions/${id}`, { notification_level: level });
      setSubscriptions((s) =>
        s.map((sub) => (sub.id === id ? { ...sub, notification_level: level } : sub))
      );
      toast.success(`Notification level updated to ${level}`);
    } catch {
      toast.error('Failed to update');
    }
  }, []);

  const filtered = subscriptions.filter((sub) => {
    if (filter === 'forums') return !!sub.forum && !sub.board && !sub.thread;
    if (filter === 'boards') return !!sub.board;
    if (filter === 'threads') return !!sub.thread;
    return true;
  });

  const counts = {
    all: subscriptions.length,
    forums: subscriptions.filter((s) => s.forum && !s.board && !s.thread).length,
    boards: subscriptions.filter((s) => !!s.board).length,
    threads: subscriptions.filter((s) => !!s.thread).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6 p-6"
    >
      <div className="flex items-center gap-3">
        <BellIcon className="h-7 w-7 text-primary-400" />
        <h1 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          My Subscriptions
        </h1>
        <span className="rounded-full bg-primary-600/20 px-2.5 py-0.5 text-sm font-medium text-primary-400">
          {subscriptions.length}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-dark-800/50 p-1">
        {(
          [
            { key: 'all', label: 'All', icon: FunnelIcon },
            { key: 'forums', label: 'Forums', icon: HashtagIcon },
            { key: 'boards', label: 'Boards', icon: QueueListIcon },
            { key: 'threads', label: 'Threads', icon: ChatBubbleLeftRightIcon },
          ] as const
        ).map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-primary-600/20 text-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TabIcon className="h-4 w-4" />
            {label}
            <span className="text-xs opacity-60">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard variant="default" className="p-12 text-center">
          <BellSlashIcon className="mx-auto mb-3 h-10 w-10 text-gray-500" />
          <p className="text-gray-400">No subscriptions yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Subscribe to forums, boards, or threads to get notified
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => {
            const targetType = sub.thread ? 'thread' : sub.board ? 'board' : 'forum';
            const targetName = sub.thread?.title ?? sub.board?.name ?? sub.forum?.name ?? 'Unknown';
            const targetPath = sub.thread
              ? `/forums/threads/${sub.thread.slug || sub.thread.id}`
              : sub.board
                ? `/forums/boards/${sub.board.slug || sub.board.id}`
                : `/forums/${sub.forum?.slug || sub.forum?.id}`;

            return (
              <GlassCard key={sub.id} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  {/* Type badge */}
                  <span className="rounded bg-dark-600 px-2 py-0.5 text-xs capitalize text-gray-400">
                    {targetType}
                  </span>

                  {/* Name */}
                  <Link
                    to={targetPath}
                    className="flex-1 truncate text-sm font-medium text-white hover:text-primary-400"
                  >
                    {targetName}
                  </Link>

                  {/* Unread badge */}
                  {sub.unread_count && sub.unread_count > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {sub.unread_count > 99 ? '99+' : sub.unread_count}
                    </span>
                  )}

                  {/* Level selector */}
                  <select
                    value={sub.notification_level}
                    onChange={(e) =>
                       
                      handleUpdateLevel(sub.id, e.target.value as 'all' | 'mentions' | 'none')
                    }
                    className="rounded-lg border border-white/10 bg-dark-700 px-2 py-1 text-xs text-gray-300"
                  >
                    <option value="all">🔔 All</option>
                    <option value="mentions">🔕 Mentions</option>
                    <option value="none">🚫 Muted</option>
                  </select>

                  {/* Unsubscribe */}
                  <button
                    onClick={() => handleUnsubscribe(sub.id)}
                    disabled={deleting === sub.id}
                    className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    title="Unsubscribe"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
