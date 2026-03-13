/**
 * FindFriendsStep component - search for and add friends during onboarding
 *
 * Uses the existing user search API (`GET /api/v1/search/users`) with
 * debounced input.  Each result shows avatar, display name, @username,
 * and an "Add Friend" / "Request Sent" toggle button.
 *
 * The step is entirely optional — callers manage skip/next via props.
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './animations';
import { useUserSearch } from '@/modules/social/hooks/useUserSearch';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FindFriendsStep');

/**
 * Find Friends onboarding step with debounced user search.
 */
export function FindFriendsStep() {
  const [query, setQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { results, isLoading } = useUserSearch(query);

  const handleAddFriend = useCallback(
    async (userId: string) => {
      if (sentRequests.has(userId) || sendingId === userId) return;

      setSendingId(userId);
      try {
        await api.post('/api/v1/friends', { friend_id: userId });
        setSentRequests((prev) => new Set(prev).add(userId));
      } catch (error) {
        logger.error('Failed to send friend request', error);
      } finally {
        setSendingId(null);
      }
    },
    [sentRequests, sendingId]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.p variants={itemVariants} className="text-center text-foreground-secondary">
        Search for people you know
      </motion.p>

      {/* Search input */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name…"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder-white/30 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </motion.div>

      {/* Results */}
      <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
        {isLoading && query.length >= 2 && (
          <p className="py-4 text-center text-sm text-gray-500">Searching…</p>
        )}

        {!isLoading && query.length >= 2 && results.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500">No users found</p>
        )}

        {results.map((user) => {
          const isSent = sentRequests.has(user.id);
          const isSending = sendingId === user.id;

          return (
            <motion.div
              key={user.id}
              variants={itemVariants}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.04]"
            >
              {/* Avatar */}
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary-600 to-purple-600">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name ?? user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {(user.display_name ?? user.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name / username */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {user.display_name ?? user.username}
                </p>
                <p className="truncate text-xs text-foreground-muted">@{user.username}</p>
              </div>

              {/* Action button */}
              <button
                type="button"
                disabled={isSent || isSending}
                onClick={() => handleAddFriend(user.id)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSent
                    ? 'bg-white/[0.06] text-gray-400'
                    : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                } disabled:cursor-not-allowed`}
              >
                {isSent ? 'Request Sent' : isSending ? '…' : 'Add Friend'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
