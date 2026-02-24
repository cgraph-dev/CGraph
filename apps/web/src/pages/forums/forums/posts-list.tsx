/**
 * Posts list component with loading states and empty state
 * @module pages/forums/forums/posts-list
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { PostCardSkeleton } from '@/components';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { PostCard } from './post-card';
import type { PostsListProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

export function PostsList({
  posts,
  isLoading,
  hasMore,
  activeForum,
  onVote,
  onLoadMore,
}: PostsListProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-3 py-4">
      <AnimatePresence mode="popLayout">
        {isLoading && posts.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="py-12 text-center"
          >
            <GlassCard variant="holographic" className="p-8">
              <SparklesIcon className="mx-auto mb-4 h-16 w-16 text-primary-400 opacity-50" />
              <p className="mb-4 text-lg text-gray-400">No posts yet</p>
              {activeForum && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={`/forums/${activeForum.slug}/create-post`}
                    onClick={() => HapticFeedback.light()}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
                    style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create First Post
                  </Link>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springs.bouncy}
            >
              <PostCard post={post} onVote={(value) => onVote(post.id, value, post.myVote)} />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      {/* Load More - Enhanced */}
      {hasMore && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 text-center"
        >
          <motion.button
            onClick={() => {
              HapticFeedback.light();
              onLoadMore();
            }}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-dark-800/80 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-dark-700 disabled:opacity-50"
            style={{
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={loop(tweens.slow)}
                />
                <span>Loading...</span>
              </div>
            ) : (
              'Load More Posts'
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
