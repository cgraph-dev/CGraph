/**
 * User Search Component
 *
 * Search input with debounced user lookup via Meilisearch,
 * displaying results with avatar, name, and "Add Friend" action.
 *
 * @module modules/social/components/user-search
 */
import { useState } from 'react';
import { useUserSearch, type UserSearchResult } from '../hooks/useUserSearch';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UserSearch');

// ============================================================================
// Result Row
// ============================================================================

function UserResultRow({
  user,
  onAddFriend,
  isPending,
}: {
  user: UserSearchResult;
  onAddFriend: (userId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5">
      {/* Avatar */}
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.display_name ?? user.username}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/60">
          {(user.display_name ?? user.username).charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name + username */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user.display_name ?? user.username}
        </p>
        <p className="truncate text-xs text-white/50">@{user.username}</p>
      </div>

      {/* Add Friend button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAddFriend(user.id)}
        className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Add Friend'}
      </button>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SearchSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
          <div className="h-7 w-20 rounded-md bg-white/10" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * User search panel with debounced input, results list, and friend actions.
 */
export function UserSearch() {
  const [query, setQuery] = useState('');
  const { results, isLoading, error } = useUserSearch(query);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleAddFriend = async (userId: string) => {
    setPendingIds((prev) => new Set(prev).add(userId));
    try {
      await api.post('/api/v1/friends', { body: { receiver_id: userId } });
    } catch (err) {
      logger.error('Failed to send friend request:', err);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Search input */}
      <div className="relative">
        {/* Magnifying glass icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 transition-colors hover:text-white/70"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results area */}
      <div className="mt-2">
        {error && <p className="px-3 py-2 text-xs text-red-400">{error}</p>}

        {isLoading && <SearchSkeleton />}

        {!isLoading && !error && query.length >= 2 && results.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-white/40">No users found</p>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-0.5">
            {results.map((user) => (
              <UserResultRow
                key={user.id}
                user={user}
                onAddFriend={handleAddFriend}
                isPending={pendingIds.has(user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
