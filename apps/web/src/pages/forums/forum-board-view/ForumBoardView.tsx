import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CogIcon } from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  UserIcon,
  LockClosedIcon,
  FireIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';

import { useForumHostingStore } from '@/stores/forumHostingStore';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';

import { BoardsList } from './BoardsList';
import { ThreadsList } from './ThreadsList';
import { MembersList } from './MembersList';
import type { ForumTab, MemberSortOption, Forum } from './types';

const logger = createLogger('ForumBoardView');

/**
 * ForumBoardView - MyBB-style board and thread listing
 *
 * Shows:
 * - Forum header with banner/icon/stats
 * - List of boards (categories/sections)
 * - Recent threads across all boards
 * - Member directory
 *
 * Design follows classic MyBB/phpBB forum layout:
 * - Boards grouped into categories
 * - Thread list with author, replies, views, last post
 */
export function ForumBoardView() {
  const { forumSlug } = useParams<{ forumSlug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { fetchForum, subscribe, unsubscribe, voteForum } = useForumStore();
  const {
    boards,
    threads,
    members,
    fetchBoards,
    fetchRecentThreads,
    fetchMembers,
    isLoadingBoards,
    isLoadingThreads,
    isLoadingMembers,
  } = useForumHostingStore();

  const [forum, setForum] = useState<Forum | null>(null);
  const [isLoadingForum, setIsLoadingForum] = useState(true);
  const [activeTab, setActiveTab] = useState<ForumTab>('boards');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState<MemberSortOption>('recent');

  useEffect(() => {
    if (forumSlug) {
      loadForum();
    }
  }, [forumSlug]);

  // Load members when tab is selected or search/sort changes
  useEffect(() => {
    if (activeTab === 'members' && forum) {
      fetchMembers(forum.id, { sort: memberSort, search: memberSearch || undefined });
    }
  }, [activeTab, forum?.id, memberSort, memberSearch]);

  const loadForum = async () => {
    if (!forumSlug) return;

    setIsLoadingForum(true);
    try {
      const forumData = await fetchForum(forumSlug);
      setForum(forumData);

      // Load boards and threads for this forum
      await Promise.all([fetchBoards(forumData.id), fetchRecentThreads(forumData.id)]);
    } catch (error) {
      logger.error('Failed to load forum:', error);
    } finally {
      setIsLoadingForum(false);
    }
  };

  const handleSubscribe = async () => {
    if (!forum) return;
    if (forum.isSubscribed) {
      await unsubscribe(forum.id);
      setForum({ ...forum, isSubscribed: false, memberCount: forum.memberCount - 1 });
    } else {
      await subscribe(forum.id);
      setForum({ ...forum, isSubscribed: true, memberCount: forum.memberCount + 1 });
    }
  };

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated || !forum) return;
    await voteForum(forum.id, value);
    // Refetch forum to get updated scores
    const updated = await fetchForum(forumSlug!);
    setForum(updated);
  };

  const isOwner = forum && user && forum.ownerId === user.id;

  if (isLoadingForum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Forum Not Found</h2>
          <p className="mb-4 text-gray-400">The forum you're looking for doesn't exist.</p>
          <Link to="/forums" className="text-primary-400 hover:underline">
            Browse all forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Forum Header */}
      <div className="relative">
        {/* Banner */}
        <div
          className="h-48 bg-gradient-to-r from-primary-600 to-primary-800"
          style={
            forum.bannerUrl
              ? {
                  backgroundImage: `url(${forum.bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
        />

        {/* Forum Info Bar */}
        <div className="border-b border-dark-700 bg-dark-800">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-dark-800 bg-primary-600">
                {forum.iconUrl ? (
                  <img
                    src={forum.iconUrl}
                    alt={forum.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {forum.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{forum.name}</h1>
                    <p className="text-gray-400">f/{forum.slug}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Voting */}
                    <div className="flex items-center gap-1 rounded-lg bg-dark-700 p-1">
                      <button
                        onClick={() => handleVote(1)}
                        disabled={!isAuthenticated}
                        className={`rounded p-2 ${forum.userVote === 1 ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-dark-600'}`}
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                      <span
                        className={`px-2 font-bold ${forum.score > 0 ? 'text-orange-400' : 'text-gray-400'}`}
                      >
                        {forum.score}
                      </span>
                      <button
                        onClick={() => handleVote(-1)}
                        disabled={!isAuthenticated}
                        className={`rounded p-2 ${forum.userVote === -1 ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-dark-600'}`}
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Join/Settings */}
                    <button
                      onClick={handleSubscribe}
                      className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                        forum.isSubscribed
                          ? 'bg-dark-700 text-white hover:bg-dark-600'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {forum.isSubscribed ? 'Joined' : 'Join'}
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => navigate(`/forums/${forum.slug}/admin`)}
                        className="rounded-lg bg-dark-700 p-2 text-gray-400 transition-colors hover:bg-dark-600"
                        title="Forum Admin Dashboard"
                      >
                        <CogIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {forum.description && <p className="mt-2 text-gray-300">{forum.description}</p>}

                {/* Stats & Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  {/* Privacy Badge */}
                  {!forum.isPublic && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                      <LockClosedIcon className="h-3 w-3" />
                      Private
                    </span>
                  )}

                  {/* Member count */}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium text-white">
                      {(forum.memberCount ?? 0).toLocaleString()}
                    </span>
                    <span>members</span>
                  </span>

                  {/* Thread count */}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span className="font-medium text-white">
                      {(forum.threadCount ?? 0).toLocaleString()}
                    </span>
                    <span>threads</span>
                  </span>

                  {/* Forum score */}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <FireIcon className="h-4 w-4 text-orange-400" />
                    <span className="font-medium text-orange-400">{forum.score ?? 0}</span>
                    <span>score</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-dark-700 bg-dark-800">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-1">
            {(
              [
                { key: 'boards', label: 'Boards', icon: FolderIcon },
                { key: 'threads', label: 'Recent Threads', icon: ChatBubbleLeftRightIcon },
                { key: 'members', label: 'Members', icon: UserIcon },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary-400 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === 'boards' && (
          <BoardsList
            boards={boards}
            forumSlug={forum.slug}
            isLoading={isLoadingBoards}
            isOwner={!!isOwner}
          />
        )}

        {activeTab === 'threads' && (
          <ThreadsList threads={threads} forumSlug={forum.slug} isLoading={isLoadingThreads} />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members}
            isLoading={isLoadingMembers}
            search={memberSearch}
            onSearchChange={setMemberSearch}
            sort={memberSort}
            onSortChange={setMemberSort}
          />
        )}
      </div>
    </div>
  );
}
