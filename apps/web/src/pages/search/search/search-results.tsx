/**
 * Search Results Panel
 *
 * Renders loading, empty, no-results, or categorised result lists
 * with staggered entrance animations.
 *
 * @module pages/search/search/SearchResults
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { SearchCategory } from '@/modules/search/store';
import type { SearchState } from './useSearch';
import { springs } from '@/lib/animation-presets/presets';
import {
  ResultSection,
  UserResult,
  GroupResult,
  ForumResult,
  PostResult,
  MessageResult,
} from './result-components';
import { tweens, loop } from '@/lib/animation-presets';

/* ─── animation helpers ─── */

const staggerTransition = (_index: number) => springs.bouncy;

/* ─── sub-renders ─── */

/** Animated loading spinner */
function LoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-12"
    >
      <div className="relative">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={loop(tweens.slow)}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={loop(tweens.ambient)}
        />
      </div>
    </motion.div>
  );
}

/** Holographic empty state shown before any search */
function InitialEmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            className="relative mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={loop(tweens.glacial)}
          >
            <div className="rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 p-4">
              <MagnifyingGlassIcon className="h-16 w-16 text-primary-400" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={loop(tweens.decorative)}
            />
          </motion.div>
          <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg font-medium text-transparent">
            Search CGraph
          </h3>
          <p className="max-w-md text-gray-400">
            Find users, groups, forums, posts, and messages. You can also search by ID using the
            quick search above.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/** No matching results */
function NoResultsState() {
  return (
    <motion.div
      key="no-results"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <GlassCard variant="holographic" className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <MagnifyingGlassIcon className="mb-4 h-16 w-16 text-gray-500" />
          <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg font-medium text-transparent">
            No results found
          </h3>
          <p className="text-gray-400">Try different keywords or search in a specific category</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ─── main component ─── */

/** Props for SearchResults */
export interface SearchResultsProps {
  /** Full search state from useSearch hook */
  state: Pick<
    SearchState,
    | 'isLoading'
    | 'hasSearched'
    | 'totalResults'
    | 'category'
    | 'users'
    | 'groups'
    | 'forums'
    | 'posts'
    | 'messages'
    | 'handleCategoryChange'
    | 'navigate'
  >;
}

/** Renders the appropriate search results panel */
export function SearchResults({ state }: SearchResultsProps) {
  const {
    isLoading,
    hasSearched,
    totalResults,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    handleCategoryChange,
    navigate,
  } = state;

  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-6">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingState />}

        {!isLoading && !hasSearched && <InitialEmptyState />}

        {!isLoading && hasSearched && totalResults === 0 && <NoResultsState />}

        {!isLoading && hasSearched && totalResults > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Users */}
            {showCategory(category, 'users', users.length) && (
              <ResultSection
                title="Users"
                count={users.length}
                onViewAll={() => handleCategoryChange('users')}
                showViewAll={category === 'all' && users.length > 3}
              >
                {(category === 'all' ? users.slice(0, 3) : users).map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={staggerTransition(i)}
                  >
                    <UserResult
                      user={user}
                      onClick={() => navigate(`/friends?userId=${user.id}`)}
                    />
                  </motion.div>
                ))}
              </ResultSection>
            )}

            {/* Groups */}
            {showCategory(category, 'groups', groups.length) && (
              <ResultSection
                title="Groups"
                count={groups.length}
                onViewAll={() => handleCategoryChange('groups')}
                showViewAll={category === 'all' && groups.length > 3}
              >
                {(category === 'all' ? groups.slice(0, 3) : groups).map((group, i) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={staggerTransition(i)}
                  >
                    <GroupResult group={group} onClick={() => navigate(`/groups/${group.id}`)} />
                  </motion.div>
                ))}
              </ResultSection>
            )}

            {/* Forums */}
            {showCategory(category, 'forums', forums.length) && (
              <ResultSection
                title="Forums"
                count={forums.length}
                onViewAll={() => handleCategoryChange('forums')}
                showViewAll={category === 'all' && forums.length > 3}
              >
                {(category === 'all' ? forums.slice(0, 3) : forums).map((forum, i) => (
                  <motion.div
                    key={forum.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={staggerTransition(i)}
                  >
                    <ForumResult forum={forum} onClick={() => navigate(`/forums/${forum.slug}`)} />
                  </motion.div>
                ))}
              </ResultSection>
            )}

            {/* Posts */}
            {showCategory(category, 'posts', posts.length) && (
              <ResultSection
                title="Posts"
                count={posts.length}
                onViewAll={() => handleCategoryChange('posts')}
                showViewAll={category === 'all' && posts.length > 3}
              >
                {(category === 'all' ? posts.slice(0, 3) : posts).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={staggerTransition(i)}
                  >
                    <PostResult
                      post={post}
                      onClick={() => navigate(`/forums/${post.forumSlug}/post/${post.id}`)}
                    />
                  </motion.div>
                ))}
              </ResultSection>
            )}

            {/* Messages */}
            {showCategory(category, 'messages', messages.length) && (
              <ResultSection
                title="Messages"
                count={messages.length}
                onViewAll={() => handleCategoryChange('messages')}
                showViewAll={category === 'all' && messages.length > 3}
              >
                {(category === 'all' ? messages.slice(0, 3) : messages).map((message, i) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={staggerTransition(i)}
                  >
                    <MessageResult
                      message={message}
                      onClick={() => navigate(`/messages/${message.conversationId}`)}
                    />
                  </motion.div>
                ))}
              </ResultSection>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── helpers ─── */

/** Whether a category section should be displayed */
function showCategory(active: SearchCategory, target: SearchCategory, count: number): boolean {
  return (active === 'all' || active === target) && count > 0;
}
