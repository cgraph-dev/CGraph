/**
 * DiscoverTab Component
 * Search and discover users, forums, and groups
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useFriendStore } from '@/modules/social/store';
import { useAuthStore } from '@/modules/auth/store';
import { getSearchResultIcon } from './utils';
import type { DiscoverTabProps } from './types';

/**
 * unknown for the social module.
 */
/**
 * Discover Tab component.
 */
export function DiscoverTab({ searchQuery, searchResults, onSearchChange }: DiscoverTabProps) {
  const navigate = useNavigate();
  const { sendRequest, friends } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users, forums, and groups..."
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-4 pl-14 pr-4 text-lg text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/30 focus:border-primary-500/40 focus:shadow-lg focus:shadow-primary-500/5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery.length === 0 ? (
        <GlassCard variant="frosted" className="relative overflow-hidden p-14 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-primary-500/[0.05] blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/3 h-32 w-32 rounded-full bg-purple-500/[0.05] blur-[80px]" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 ring-1 ring-white/[0.06]">
              <MagnifyingGlassIcon className="h-12 w-12 text-primary-400/50" />
            </div>
            <h3 className="mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-xl font-bold text-transparent">
              Discover CGraph
            </h3>
            <p className="mx-auto max-w-md text-sm text-white/40">
              Search for users, forums, and groups to connect with
            </p>
          </div>
        </GlassCard>
      ) : searchResults.length === 0 ? (
        <GlassCard variant="frosted" className="p-10 text-center">
          <p className="text-white/50">
            No results found for "<span className="text-white/70">{searchQuery}</span>"
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            {searchResults.length} Results
            <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </h3>
          {searchResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant="crystal"
                className="cursor-pointer p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-500/5"
                onClick={() => {
                  if (result.type === 'user') {
                    navigate(`/user/${result.id}`);
                  } else if (result.type === 'forum') {
                    navigate(`/forums/${result.id}`);
                  } else if (result.type === 'group') {
                    navigate(`/groups/${result.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-2xl ring-1 ring-white/[0.06]">
                    {getSearchResultIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{result.name}</h4>
                    <p className="text-sm text-white/40">{result.description}</p>
                    {result.memberCount && (
                      <p className="mt-1 text-xs text-white/30">
                        {result.memberCount.toLocaleString()} members
                      </p>
                    )}
                  </div>
                  {result.type === 'user' && result.id !== currentUser?.id && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isFriend = friends.some((f) => f.id === result.id);
                        if (!isFriend) {
                          sendRequest(result.id);
                          HapticFeedback.success();
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                        friends.some((f) => f.id === result.id)
                          ? 'bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08]'
                          : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30'
                      }`}
                      disabled={friends.some((f) => f.id === result.id)}
                    >
                      {friends.some((f) => f.id === result.id) ? (
                        'Friends'
                      ) : (
                        <>
                          <UserPlusIcon className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </motion.button>
                  )}
                  {result.type !== 'user' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        HapticFeedback.medium();
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                        result.isJoined
                          ? 'bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08] hover:bg-white/[0.1]'
                          : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30'
                      }`}
                    >
                      {result.isJoined ? 'Joined' : 'Join'}
                    </motion.button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
