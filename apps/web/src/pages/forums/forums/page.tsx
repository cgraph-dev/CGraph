/**
 * Forums page — MyBB-style category/board directory
 * @module pages/forums/forums/page
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import { motion } from 'motion/react';
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import type { Forum } from '@/modules/forums/store/forumStore.types';

/** Skeleton rows for loading state */
function ForumDirectorySkeleton() {
  return (
    <div className="space-y-6 p-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-lg bg-white/[0.06]">
          <div className="h-10 animate-pulse bg-white/[0.04]" />
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              className="h-16 animate-pulse border-t border-white/[0.06] bg-white/[0.02]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Single forum row in the directory table */
function ForumRow({ forum }: { forum: Forum }) {
  return (
    <Link
      to={`/forums/${forum.slug}`}
      className="grid grid-cols-12 items-center gap-4 border-t border-white/[0.06] px-4 py-3 transition-colors hover:bg-white/[0.04]"
    >
      {/* Forum name + description */}
      <div className="col-span-6 flex items-start gap-3">
        {forum.iconUrl ? (
          <img
            src={forum.iconUrl}
            alt=""
            className="mt-0.5 h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600/20">
            <FolderIcon className="h-5 w-5 text-primary-400" />
          </div>
        )}
        <div className="min-w-0">
          <span className="font-semibold text-white hover:text-primary-400">{forum.name}</span>
          {forum.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-gray-400">{forum.description}</p>
          )}
          {forum.categories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {forum.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}20` : 'rgba(139,92,246,0.12)',
                    color: cat.color ?? '#a78bfa',
                  }}
                >
                  {cat.name}
                </span>
              ))}
              {forum.categories.length > 3 && (
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-gray-400">
                  +{forum.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thread count */}
      <div className="col-span-2 text-center text-sm text-gray-300">
        {forum.threadCount?.toLocaleString() ?? '0'}
      </div>

      {/* Post count */}
      <div className="col-span-2 text-center text-sm text-gray-300">
        {forum.postCount?.toLocaleString() ?? '0'}
      </div>

      {/* Members */}
      <div className="col-span-2 text-right text-sm text-gray-400">
        <div className="flex items-center justify-end gap-1">
          <UsersIcon className="h-3.5 w-3.5" />
          {forum.memberCount.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

/** Group forums by their first category (uncategorized fallback) */
function groupForumsByCategory(forums: Forum[]): { label: string; forums: Forum[] }[] {
  const grouped = new Map<string, { label: string; forums: Forum[] }>();
  const uncategorized: Forum[] = [];

  for (const forum of forums) {
    const primary = forum.categories[0];
    if (primary) {
      const key = primary.id;
      const existing = grouped.get(key);
      if (existing) {
        existing.forums.push(forum);
      } else {
        grouped.set(key, { label: primary.name, forums: [forum] });
      }
    } else {
      uncategorized.push(forum);
    }
  }

  const result = [...grouped.values()];
  if (uncategorized.length > 0) {
    result.push({ label: 'General', forums: uncategorized });
  }
  return result;
}

/**
 * Forums directory — MyBB/phpBB style category + board listing.
 */
export default function Forums() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { forums, isLoadingForums, fetchForums } = useForumStore();

  useEffect(() => {
    fetchForums();
  }, [fetchForums]);

  const groups = groupForumsByCategory(forums);
  const totalThreads = forums.reduce((sum, f) => sum + (f.threadCount ?? 0), 0);
  const totalPosts = forums.reduce((sum, f) => sum + (f.postCount ?? 0), 0);
  const totalMembers = forums.reduce((sum, f) => sum + f.memberCount, 0);

  return (
    <div className="relative flex-1 overflow-y-auto bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* Header bar */}
      <div className="border-b border-white/[0.08] bg-white/[0.03] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Forum Directory</h1>
            <p className="mt-1 text-sm text-gray-400">
              {forums.length} forum{forums.length !== 1 ? 's' : ''} &middot;{' '}
              {totalThreads.toLocaleString()} threads &middot; {totalPosts.toLocaleString()} posts
              &middot; {totalMembers.toLocaleString()} members
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => navigate('/forums/create')}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4" />
              Create Forum
            </button>
          )}
        </div>
      </div>

      {/* Forum directory */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        {isLoadingForums ? (
          <ForumDirectorySkeleton />
        ) : forums.length === 0 ? (
          <div className="py-16 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h2 className="mb-2 text-xl font-bold text-white">No Forums Yet</h2>
            <p className="mb-6 text-gray-400">
              {isAuthenticated
                ? 'Be the first to create a forum and start a community.'
                : 'Sign in to create a forum and start a community.'}
            </p>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/forums/create')}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
              >
                <PlusIcon className="h-5 w-5" />
                Create Forum
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {groups.map((group) => (
              <div
                key={group.label}
                className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04]"
              >
                {/* Category header */}
                <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-2.5">
                  <FolderIcon className="h-4 w-4 text-primary-400" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-primary-300">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-500">({group.forums.length})</span>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="col-span-6">Forum</div>
                  <div className="col-span-2 text-center">Threads</div>
                  <div className="col-span-2 text-center">Posts</div>
                  <div className="col-span-2 text-right">Members</div>
                </div>

                {/* Forum rows */}
                {group.forums.map((forum) => (
                  <ForumRow key={forum.id} forum={forum} />
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
