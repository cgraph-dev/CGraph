/**
 * Analytics Panel
 *
 * Forum performance metrics and insights.
 *
 * @module pages/forums/ForumAdmin/panels/AnalyticsPanel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumAnalytics } from '../types';

interface AnalyticsPanelProps {
  analytics: ForumAnalytics;
}

export const AnalyticsPanel = memo(function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Analytics</h2>
        <p className="text-gray-400">Forum performance and insights.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <UsersIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics.totalMembers}</p>
              <p className="text-sm text-gray-400">Total Members</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics.totalPosts}</p>
              <p className="text-sm text-gray-400">Total Posts</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics.postsThisWeek}</p>
              <p className="text-sm text-gray-400">Posts This Week</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <SparklesIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${analytics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {analytics.growthRate >= 0 ? '+' : ''}
                {analytics.growthRate}%
              </p>
              <p className="text-sm text-gray-400">Growth Rate</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Top Contributors</h3>
        <div className="space-y-3">
          {analytics.topPosters.map((poster, index) => (
            <div key={poster.username} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? 'bg-yellow-500 text-black'
                    : index === 1
                      ? 'bg-gray-400 text-black'
                      : 'bg-orange-600 text-white'
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-white">{poster.username}</span>
              <span className="text-gray-400">{poster.count} posts</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
});
