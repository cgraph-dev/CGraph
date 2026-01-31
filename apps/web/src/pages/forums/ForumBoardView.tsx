import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumBoardView');
import { useForumHostingStore, Board, Thread, ForumMember } from '@/stores/forumHostingStore';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { getAvatarBorderId } from '@/lib/utils';
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  FolderOpenIcon,
  EyeIcon,
  UserIcon,
  PlusIcon,
  LockClosedIcon,
  FireIcon,
  CogIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

/**
 * ForumBoardView - MyBB-style board and thread listing
 *
 * Shows:
 * - Forum header with banner/icon/stats
 * - List of boards (categories/sections)
 * - Recent threads across all boards
 * - Announcements
 *
 * Design follows classic MyBB/phpBB forum layout:
 * - Boards grouped into categories
 * - Thread list with author, replies, views, last post
 */
export default function ForumBoardView() {
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
  const [activeTab, setActiveTab] = useState<'boards' | 'threads' | 'members'>('boards');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSort, setMemberSort] = useState<'recent' | 'reputation' | 'posts' | 'alphabetical'>(
    'recent'
  );

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

interface BoardsListProps {
  boards: Board[];
  forumSlug: string;
  isLoading: boolean;
  isOwner: boolean;
}

function BoardsList({ boards, forumSlug, isLoading, isOwner }: BoardsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="py-12 text-center">
        <FolderIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <h3 className="mb-2 text-xl font-bold text-white">No Boards Yet</h3>
        <p className="mb-4 text-gray-400">
          {isOwner
            ? 'Create your first board to organize discussions.'
            : "This forum doesn't have any boards yet."}
        </p>
        {isOwner && (
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        )}
      </div>
    );
  }

  // Group boards by parent (for hierarchical display)
  const topLevelBoards = boards.filter((b) => !b.parentId);

  return (
    <div className="space-y-4">
      {/* Create Board Button */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        </div>
      )}

      {/* Boards Table */}
      <div className="overflow-hidden rounded-lg bg-dark-700">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-dark-600 bg-dark-800 px-4 py-3 text-sm font-medium text-gray-400">
          <div className="col-span-6">Board</div>
          <div className="col-span-2 text-center">Threads</div>
          <div className="col-span-2 text-center">Posts</div>
          <div className="col-span-2">Last Post</div>
        </div>

        {/* Board Rows */}
        {topLevelBoards.map((board) => (
          <BoardRow key={board.id} board={board} forumSlug={forumSlug} />
        ))}
      </div>
    </div>
  );
}

interface BoardRowProps {
  board: Board;
  forumSlug: string;
}

function BoardRow({ board, forumSlug }: BoardRowProps) {
  return (
    <Link
      to={`/forums/${forumSlug}/boards/${board.slug}`}
      className="grid grid-cols-12 gap-4 border-b border-dark-600 px-4 py-4 transition-colors last:border-b-0 hover:bg-dark-600/50"
    >
      {/* Board Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="rounded-lg bg-primary-600/20 p-2">
          <FolderOpenIcon className="h-6 w-6 text-primary-400" />
        </div>
        <div>
          <h3 className="font-medium text-white transition-colors hover:text-primary-400">
            {board.name}
          </h3>
          {board.description && (
            <p className="line-clamp-1 text-sm text-gray-400">{board.description}</p>
          )}
        </div>
      </div>

      {/* Thread Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(board.threadCount ?? 0).toLocaleString()}
      </div>

      {/* Post Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(board.postCount ?? 0).toLocaleString()}
      </div>

      {/* Last Post */}
      <div className="col-span-2 text-sm text-gray-400">
        {board.lastPostAt ? (
          <div>
            <p className="truncate text-gray-300">{board.lastPostTitle || 'No title'}</p>
            <p className="text-xs">
              by {board.lastPostAuthor || 'Unknown'} ·{' '}
              {new Date(board.lastPostAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <span className="text-gray-500">No posts yet</span>
        )}
      </div>
    </Link>
  );
}

interface ThreadsListProps {
  threads: Thread[];
  forumSlug: string;
  isLoading: boolean;
}

function ThreadsList({ threads, forumSlug, isLoading }: ThreadsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <h3 className="mb-2 text-xl font-bold text-white">No Threads Yet</h3>
        <p className="text-gray-400">
          Start a discussion by creating a thread in one of the boards.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-dark-700">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-dark-600 bg-dark-800 px-4 py-3 text-sm font-medium text-gray-400">
        <div className="col-span-6">Thread</div>
        <div className="col-span-2 text-center">Replies</div>
        <div className="col-span-2 text-center">Views</div>
        <div className="col-span-2">Last Reply</div>
      </div>

      {/* Thread Rows */}
      {threads.map((thread) => (
        <ThreadRow key={thread.id} thread={thread} forumSlug={forumSlug} />
      ))}
    </div>
  );
}

interface ThreadRowProps {
  thread: Thread;
  forumSlug: string;
}

function ThreadRow({ thread, forumSlug }: ThreadRowProps) {
  return (
    <Link
      to={`/forums/${forumSlug}/threads/${thread.id}`}
      className="grid grid-cols-12 gap-4 border-b border-dark-600 px-4 py-4 transition-colors last:border-b-0 hover:bg-dark-600/50"
    >
      {/* Thread Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          {thread.isPinned ? (
            <MapPinIcon className="h-5 w-5 text-yellow-500" />
          ) : thread.isLocked ? (
            <LockClosedIcon className="h-5 w-5 text-red-400" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-white transition-colors hover:text-primary-400">
              {thread.title}
            </h3>
            {thread.isPinned && (
              <span className="rounded bg-yellow-600/20 px-1.5 py-0.5 text-xs text-yellow-400">
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-xs text-red-400">
                Locked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            by {thread.author?.displayName || thread.author?.username || 'Unknown'} ·{' '}
            {new Date(thread.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Reply Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(thread.replyCount ?? 0).toLocaleString()}
      </div>

      {/* View Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        <EyeIcon className="mr-1 h-4 w-4 text-gray-500" />
        {(thread.viewCount ?? 0).toLocaleString()}
      </div>

      {/* Last Reply */}
      <div className="col-span-2 text-sm text-gray-400">
        {thread.lastReplyAt ? (
          <div>
            <p className="text-xs">{thread.lastReplyBy || 'Unknown'}</p>
            <p className="text-xs text-gray-500">
              {new Date(thread.lastReplyAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <span className="text-gray-500">No replies</span>
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// Members List Component
// =============================================================================

interface MembersListProps {
  members: ForumMember[];
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  sort: 'recent' | 'reputation' | 'posts' | 'alphabetical';
  onSortChange: (sort: 'recent' | 'reputation' | 'posts' | 'alphabetical') => void;
}

function MembersList({
  members,
  isLoading,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: MembersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as typeof sort)}
          className="rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="recent">Recently Joined</option>
          <option value="reputation">Reputation</option>
          <option value="posts">Most Posts</option>
          <option value="alphabetical">A-Z</option>
        </select>
      </div>

      {/* Members Grid */}
      {members.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

interface MemberCardProps {
  member: ForumMember;
}

function MemberCard({ member }: MemberCardProps) {
  const roleColors = {
    owner: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    member: 'bg-dark-600 text-gray-400 border-dark-500',
  };

  const roleIcons = {
    owner: StarIcon,
    admin: ShieldCheckIcon,
    moderator: ShieldCheckIcon,
    member: UserIcon,
  };

  const RoleIcon = roleIcons[member.role];

  return (
    <Link
      to={`/profile/${member.userId}`}
      className="flex items-center gap-4 rounded-lg border border-dark-600 bg-dark-700 p-4 transition-colors hover:border-primary-500/50"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {member.avatarUrl ? (
          <ThemedAvatar
            src={member.avatarUrl}
            alt={member.displayName || 'User'}
            size="medium"
            avatarBorderId={getAvatarBorderId(member)}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-600">
            <UserIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-white">{member.displayName || 'Member'}</h3>
          {member.role !== 'member' && (
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${roleColors[member.role]}`}
            >
              <RoleIcon className="h-3 w-3" />
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </span>
          )}
        </div>
        {member.title && <p className="text-sm text-primary-400">{member.title}</p>}
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
          <span>{member.postCount.toLocaleString()} posts</span>
          <span>
            {member.reputation >= 0 ? '+' : ''}
            {member.reputation} rep
          </span>
          {member.joinedAt && <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </Link>
  );
}
