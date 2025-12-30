import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForumHostingStore, Board, Thread } from '@/stores/forumHostingStore';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
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
  const { boards, threads, fetchBoards, fetchRecentThreads, isLoadingBoards, isLoadingThreads } = useForumHostingStore();

  const [forum, setForum] = useState<Forum | null>(null);
  const [isLoadingForum, setIsLoadingForum] = useState(true);
  const [activeTab, setActiveTab] = useState<'boards' | 'threads' | 'members'>('boards');

  useEffect(() => {
    if (forumSlug) {
      loadForum();
    }
  }, [forumSlug]);

  const loadForum = async () => {
    if (!forumSlug) return;
    
    setIsLoadingForum(true);
    try {
      const forumData = await fetchForum(forumSlug);
      setForum(forumData);
      
      // Load boards and threads for this forum
      await Promise.all([
        fetchBoards(forumData.id),
        fetchRecentThreads(forumData.id),
      ]);
    } catch (error) {
      console.error('Failed to load forum:', error);
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
      <div className="flex-1 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Forum Not Found</h2>
          <p className="text-gray-400 mb-4">The forum you're looking for doesn't exist.</p>
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
          style={forum.bannerUrl ? { backgroundImage: `url(${forum.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />

        {/* Forum Info Bar */}
        <div className="bg-dark-800 border-b border-dark-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="h-24 w-24 -mt-12 rounded-xl border-4 border-dark-800 bg-primary-600 flex items-center justify-center overflow-hidden">
                {forum.iconUrl ? (
                  <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{forum.name?.[0]?.toUpperCase()}</span>
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
                    <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
                      <button
                        onClick={() => handleVote(1)}
                        disabled={!isAuthenticated}
                        className={`p-2 rounded ${forum.userVote === 1 ? 'bg-orange-500 text-white' : 'hover:bg-dark-600 text-gray-400'}`}
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                      <span className={`px-2 font-bold ${forum.score > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
                        {forum.score}
                      </span>
                      <button
                        onClick={() => handleVote(-1)}
                        disabled={!isAuthenticated}
                        className={`p-2 rounded ${forum.userVote === -1 ? 'bg-blue-500 text-white' : 'hover:bg-dark-600 text-gray-400'}`}
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Join/Settings */}
                    <button
                      onClick={handleSubscribe}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        forum.isSubscribed
                          ? 'bg-dark-700 text-white hover:bg-dark-600'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {forum.isSubscribed ? 'Joined' : 'Join'}
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => navigate(`/forums/${forum.slug}/settings`)}
                        className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-gray-400 transition-colors"
                      >
                        <CogIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {forum.description && (
                  <p className="mt-2 text-gray-300">{forum.description}</p>
                )}

                {/* Stats & Badges */}
                <div className="mt-3 flex items-center flex-wrap gap-4 text-sm">
                  {/* Privacy Badge */}
                  {!forum.isPublic && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                      <LockClosedIcon className="h-3 w-3" />
                      Private
                    </span>
                  )}
                  
                  {/* Member count */}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium text-white">{(forum.memberCount ?? 0).toLocaleString()}</span>
                    <span>members</span>
                  </span>
                  
                  {/* Thread count */}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span className="font-medium text-white">{(forum as any).thread_count?.toLocaleString() || '0'}</span>
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
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {[
              { key: 'boards', label: 'Boards', icon: FolderIcon },
              { key: 'threads', label: 'Recent Threads', icon: ChatBubbleLeftRightIcon },
              { key: 'members', label: 'Members', icon: UserIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-400 border-b-2 border-primary-400'
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'boards' && (
          <BoardsList 
            boards={boards} 
            forumSlug={forum.slug}
            isLoading={isLoadingBoards}
            isOwner={!!isOwner}
          />
        )}

        {activeTab === 'threads' && (
          <ThreadsList
            threads={threads}
            forumSlug={forum.slug}
            isLoading={isLoadingThreads}
          />
        )}

        {activeTab === 'members' && (
          <div className="text-center py-12 text-gray-400">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Member list coming soon...</p>
          </div>
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
          <div key={i} className="animate-pulse bg-dark-700 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Boards Yet</h3>
        <p className="text-gray-400 mb-4">
          {isOwner ? "Create your first board to organize discussions." : "This forum doesn't have any boards yet."}
        </p>
        {isOwner && (
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        )}
      </div>
    );
  }

  // Group boards by parent (for hierarchical display)
  const topLevelBoards = boards.filter(b => !b.parentId);

  return (
    <div className="space-y-4">
      {/* Create Board Button */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        </div>
      )}

      {/* Boards Table */}
      <div className="bg-dark-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-dark-800 text-sm font-medium text-gray-400 border-b border-dark-600">
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
      className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-dark-600/50 transition-colors border-b border-dark-600 last:border-b-0"
    >
      {/* Board Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="p-2 bg-primary-600/20 rounded-lg">
          <FolderOpenIcon className="h-6 w-6 text-primary-400" />
        </div>
        <div>
          <h3 className="font-medium text-white hover:text-primary-400 transition-colors">
            {board.name}
          </h3>
          {board.description && (
            <p className="text-sm text-gray-400 line-clamp-1">{board.description}</p>
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
            <p className="text-gray-300 truncate">{board.lastPostTitle || 'No title'}</p>
            <p className="text-xs">
              by {board.lastPostAuthor || 'Unknown'} · {new Date(board.lastPostAt).toLocaleDateString()}
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
          <div key={i} className="animate-pulse bg-dark-700 rounded-lg h-16" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Threads Yet</h3>
        <p className="text-gray-400">Start a discussion by creating a thread in one of the boards.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-dark-800 text-sm font-medium text-gray-400 border-b border-dark-600">
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
      className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-dark-600/50 transition-colors border-b border-dark-600 last:border-b-0"
    >
      {/* Thread Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
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
            <h3 className="font-medium text-white hover:text-primary-400 transition-colors truncate">
              {thread.title}
            </h3>
            {thread.isPinned && (
              <span className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded">Pinned</span>
            )}
            {thread.isLocked && (
              <span className="px-1.5 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">Locked</span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            by {thread.author?.displayName || thread.author?.username || 'Unknown'} · {new Date(thread.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Reply Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(thread.replyCount ?? 0).toLocaleString()}
      </div>

      {/* View Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        <EyeIcon className="h-4 w-4 mr-1 text-gray-500" />
        {(thread.viewCount ?? 0).toLocaleString()}
      </div>

      {/* Last Reply */}
      <div className="col-span-2 text-sm text-gray-400">
        {thread.lastReplyAt ? (
          <div>
            <p className="text-xs">
              {thread.lastReplyBy || 'Unknown'}
            </p>
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
