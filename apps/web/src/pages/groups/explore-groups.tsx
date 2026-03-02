/**
 * Explore Groups Page
 *
 * Dedicated page for discovering and joining public groups.
 * Features search, sort, and join functionality.
 *
 * @module pages/groups/explore-groups
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import type { Group } from '@/modules/groups/store';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
] as const;

/**
 * Explore Groups page component.
 */
export default function ExploreGroups() {
  const navigate = useNavigate();
  const {
    discoverableGroups,
    isLoadingDiscover,
    fetchDiscoverableGroups,
    joinPublicGroup,
    groups,
  } = useGroupStore();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('popular');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial fetch
  useEffect(() => {
    fetchDiscoverableGroups({ sort });
  }, [fetchDiscoverableGroups, sort]);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchDiscoverableGroups({ search: value, sort });
      }, 300);
    },
    [fetchDiscoverableGroups, sort]
  );

  // Join a public group
  const handleJoin = async (group: Group) => {
    setJoiningId(group.id);
    try {
      await joinPublicGroup(group.id);
      navigate(`/groups/${group.id}`);
    } catch {
      // Error handled silently — user can retry
    } finally {
      setJoiningId(null);
    }
  };

  // Check if user is already a member
  const isMember = (groupId: string) => groups.some((g) => g.id === groupId);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-6 w-6 text-primary-400" />
            <h1 className="text-xl font-bold text-white">Explore Groups</h1>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search public groups..."
              className="w-full rounded-xl bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-primary-500/50"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl bg-dark-800 px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-primary-500/50"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoadingDiscover && discoverableGroups.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : discoverableGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SparklesIcon className="mb-4 h-12 w-12 text-white/20" />
            <h3 className="text-lg font-semibold text-white/60">No groups found</h3>
            <p className="mt-1 text-sm text-white/40">
              {search ? 'Try a different search term' : 'No public groups available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoverableGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="cursor-pointer rounded-xl border border-white/10 bg-dark-800/60 p-4 transition-colors hover:border-primary-500/30 hover:bg-dark-800"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {/* Group Banner / Icon */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 text-lg font-bold text-white">
                    {group.iconUrl ? (
                      <img
                        src={group.iconUrl}
                        alt={group.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      group.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">{group.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      <span>
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-white/60">{group.description}</p>
                )}

                {/* Join Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMember(group.id)) handleJoin(group);
                  }}
                  disabled={isMember(group.id) || joiningId === group.id}
                  className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                    isMember(group.id)
                      ? 'bg-dark-700 text-white/40'
                      : joiningId === group.id
                        ? 'bg-primary-600/50 text-white/60'
                        : 'bg-primary-600 text-white hover:bg-primary-500'
                  }`}
                >
                  {isMember(group.id)
                    ? 'Joined'
                    : joiningId === group.id
                      ? 'Joining...'
                      : 'Join Group'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
