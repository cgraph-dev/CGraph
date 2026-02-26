/**
 * Forum sidebar component with community info and popular forums
 * @module pages/forums/forums/forum-sidebar
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import { LeaderboardSidebar } from '@/modules/forums/components/leaderboard-widget';
import type { ForumSidebarProps } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the forums module.
 */
/**
 * Forum Sidebar component.
 */
export function ForumSidebar({ activeForum, forums, isLoadingForums }: ForumSidebarProps) {
  return (
    <div className="relative z-10 hidden w-80 overflow-y-auto border-l border-primary-500/20 bg-dark-900/50 p-4 backdrop-blur-xl lg:block">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

      <div className="relative z-10 space-y-4">
        {/* Create Post - Enhanced */}
        {activeForum ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={`/forums/${activeForum.slug}/create-post`}
              onClick={() => HapticFeedback.light()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 py-3 font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
              style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
            >
              <PlusIcon className="h-5 w-5" />
              Create Post
            </Link>
          </motion.div>
        ) : (
          <GlassCard variant="crystal" className="p-3">
            <p className="text-center text-sm text-gray-400">Select a forum to create a post</p>
          </GlassCard>
        )}

        {/* About Community (if viewing forum) */}
        {activeForum && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard variant="frosted" className="p-4">
              <h3 className="mb-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text font-semibold text-transparent">
                About Community
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                {activeForum.description || 'No description available.'}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Members</span>
                  <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text font-medium text-transparent text-white">
                    {(activeForum.memberCount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span className="font-medium text-white">
                    {formatTimeAgo(activeForum.createdAt)}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Leaderboard Widget - Forum-specific or Global */}
        <div className="mb-4">
          <LeaderboardSidebar forumId={activeForum?.id} forumSlug={activeForum?.slug} />
        </div>

        {/* Popular Communities - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard variant="frosted" className="p-4">
            <h3 className="mb-3 bg-gradient-to-r from-white to-primary-200 bg-clip-text font-semibold text-transparent">
              Popular Communities
            </h3>
            <div className="space-y-2">
              {isLoadingForums ? (
                // Skeleton loading for communities
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="-mx-2 flex animate-pulse items-center gap-3 p-2">
                    <div className="h-8 w-8 rounded-full bg-dark-600/50" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 h-4 w-24 rounded bg-dark-600/50" />
                      <div className="h-3 w-16 rounded bg-dark-600/50" />
                    </div>
                  </div>
                ))
              ) : forums.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No communities found</p>
              ) : (
                forums.slice(0, 5).map((forum, index) => (
                  <motion.div
                    key={forum.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <Link
                      to={`/forums/${forum.slug}`}
                      onClick={() => HapticFeedback.light()}
                      className="group -mx-2 flex items-center gap-3 rounded p-2 transition-all duration-200 hover:bg-primary-500/10"
                    >
                      <motion.div
                        className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20"
                        whileHover={{ scale: 1.1 }}
                        transition={springs.snappy}
                      >
                        {forum.iconUrl ? (
                          <img
                            src={forum.iconUrl}
                            alt={forum.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-purple-600 bg-clip-text text-sm font-bold text-transparent">
                            {forum.name.charAt(0)}
                          </div>
                        )}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-primary-400">
                            c/{forum.slug}
                          </p>
                          {!forum.isPublic && (
                            <LockClosedIcon className="h-3 w-3 flex-shrink-0 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {(forum.memberCount ?? 0).toLocaleString()} members
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
