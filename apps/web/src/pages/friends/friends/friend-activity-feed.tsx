/**
 * FriendActivityFeed - Shows what friends are doing
 * Playing, streaming, listening, watching activities
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { entranceVariants, staggerConfigs } from '@/lib/animation-presets';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import { api } from '@/lib/api';

interface FriendActivity {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  activity_type: 'playing' | 'streaming' | 'listening' | 'watching' | 'competing' | 'custom';
  activity_name: string;
  started_at: string;
  details?: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  playing: '🎮',
  streaming: '📡',
  listening: '🎵',
  watching: '📺',
  competing: '🏆',
  custom: '💬',
};

const ACTIVITY_LABELS: Record<string, string> = {
  playing: 'Playing',
  streaming: 'Streaming',
  listening: 'Listening to',
  watching: 'Watching',
  competing: 'Competing in',
  custom: '',
};

/**
 * Friend Activity Feed component.
 */
export function FriendActivityFeed() {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/friends/activity');
      setActivities(data.data || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Adaptive polling: 30s active, 120s hidden
  useAdaptiveInterval(fetchActivities, 30_000);

  const formatDuration = (startedAt: string) => {
    const diff = Date.now() - new Date(startedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-white/30">No friend activity right now</div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: staggerConfigs.fast.staggerChildren } },
      }}
      className="space-y-1"
    >
      <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/30">
        Activity
      </h4>
      {activities.map((activity) => (
        <motion.div
          key={activity.user_id}
          variants={entranceVariants.fadeUp}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
        >
          <div className="relative h-8 w-8 flex-shrink-0">
            {activity.avatar_url ? (
              <img
                src={activity.avatar_url}
                alt={activity.display_name || activity.username}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-sm font-bold text-white">
                {(activity.display_name || activity.username).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 text-xs">
              {ACTIVITY_ICONS[activity.activity_type]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-white">
              {activity.display_name || activity.username}
            </span>
            <p className="truncate text-xs text-white/40">
              {ACTIVITY_LABELS[activity.activity_type]} {activity.activity_name}
            </p>
          </div>
          <span className="text-[10px] text-white/20">{formatDuration(activity.started_at)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
