import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumStore, Post } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  TrophyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpIconSolid, ArrowDownIcon as ArrowDownIconSolid } from '@heroicons/react/24/solid';

const sortOptions = [
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'new', label: 'New', icon: ClockIcon },
  { value: 'top', label: 'Top', icon: ArrowTrendingUpIcon },
] as const;

const timeRangeOptions = [
  { value: 'hour', label: 'Past Hour' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

export default function Forums() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user: _user, isAuthenticated } = useAuthStore();
  const {
    forums,
    posts,
    isLoadingForums: _isLoadingForums,
    isLoadingPosts,
    hasMorePosts,
    sortBy,
    timeRange,
    fetchForums,
    fetchForum,
    fetchPosts,
    vote,
    subscribe,
    unsubscribe,
    setSortBy,
    setTimeRange,
  } = useForumStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [page, setPage] = useState(1);

  const activeForum = forumSlug ? forums.find((f) => f.slug === forumSlug) : null;

  useEffect(() => {
    fetchForums();
  }, [fetchForums]);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

  useEffect(() => {
    setPage(1);
    fetchPosts(forumSlug, 1);
  }, [forumSlug, sortBy, timeRange, fetchPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(forumSlug, nextPage);
  };

  const handleVote = async (postId: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
    const newValue = currentVote === value ? null : value;
    await vote('post', postId, newValue);
  };

  const handleSubscribe = async (forumId: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      await unsubscribe(forumId);
    } else {
      await subscribe(forumId);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Forum Header (if viewing specific forum) */}
        {activeForum && (
          <div className="relative">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800">
              {activeForum.bannerUrl && (
                <img
                  src={activeForum.bannerUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Forum Info */}
            <div className="bg-dark-800 border-b border-dark-700">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 -mt-10 rounded-full border-4 border-dark-800 bg-dark-700 overflow-hidden">
                    {activeForum.iconUrl ? (
                      <img
                        src={activeForum.iconUrl}
                        alt={activeForum.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {activeForum.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-white">{activeForum.name}</h1>
                        <p className="text-gray-400">c/{activeForum.slug}</p>
                      </div>

                      <button
                        onClick={() => handleSubscribe(activeForum.id, activeForum.isSubscribed)}
                        className={`px-4 py-2 rounded-full font-medium transition-colors ${
                          activeForum.isSubscribed
                            ? 'bg-dark-700 text-white hover:bg-dark-600'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {activeForum.isSubscribed ? 'Joined' : 'Join'}
                      </button>
                    </div>

                    {activeForum.description && (
                      <p className="mt-2 text-gray-300">{activeForum.description}</p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      {activeForum.memberCount.toLocaleString()} members
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="sticky top-0 z-10 bg-dark-900 border-b border-dark-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {/* Quick Actions */}
            <div className="flex items-center gap-2 mr-auto">
              <Link
                to="/forums/leaderboard"
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-full text-sm font-medium text-white transition-colors"
              >
                <TrophyIcon className="h-4 w-4" />
                Leaderboard
              </Link>
              
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/forums/create')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-full text-sm font-medium text-white transition-colors"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Create Forum
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-full text-sm font-medium text-white transition-colors"
              >
                {sortOptions.find((s) => s.value === sortBy)?.icon && (
                  <span className="h-4 w-4">
                    {(() => {
                      const Icon = sortOptions.find((s) => s.value === sortBy)!.icon;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </span>
                )}
                {sortOptions.find((s) => s.value === sortBy)?.label}
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2 flex items-center gap-2 hover:bg-dark-700 transition-colors ${
                          sortBy === option.value ? 'text-primary-400' : 'text-white'
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Time Range (only for Top) */}
            {sortBy === 'top' && (
              <div className="relative">
                <button
                  onClick={() => setShowTimeMenu(!showTimeMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-full text-sm font-medium text-white transition-colors"
                >
                  {timeRangeOptions.find((t) => t.value === timeRange)?.label}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {showTimeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTimeMenu(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-20">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value);
                            setShowTimeMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-dark-700 transition-colors ${
                            timeRange === option.value ? 'text-primary-400' : 'text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="max-w-4xl mx-auto py-4 space-y-3">
          {isLoadingPosts && posts.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No posts yet</p>
              <Link
                to="#"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Create Post
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={(value) => handleVote(post.id, value, post.myVote)}
              />
            ))
          )}

          {/* Load More */}
          {hasMorePosts && posts.length > 0 && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingPosts}
                className="px-6 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-full transition-colors disabled:opacity-50"
              >
                {isLoadingPosts ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-dark-800 border-l border-dark-700 p-4 overflow-y-auto hidden lg:block">
        {/* Create Post */}
        <Link
          to="#"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors mb-4"
        >
          <PlusIcon className="h-5 w-5" />
          Create Post
        </Link>

        {/* About Community (if viewing forum) */}
        {activeForum && (
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-white mb-2">About Community</h3>
            <p className="text-sm text-gray-400 mb-4">
              {activeForum.description || 'No description available.'}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Members</span>
              <span className="text-white font-medium">
                {activeForum.memberCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-400">Created</span>
              <span className="text-white font-medium">
                {formatDistanceToNow(new Date(activeForum.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}

        {/* Popular Communities */}
        <div className="bg-dark-700 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Popular Communities</h3>
          <div className="space-y-2">
            {forums.slice(0, 5).map((forum) => (
              <Link
                key={forum.id}
                to={`/forums/${forum.slug}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-dark-600 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-dark-600 overflow-hidden">
                  {forum.iconUrl ? (
                    <img
                      src={forum.iconUrl}
                      alt={forum.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                      {forum.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">c/{forum.slug}</p>
                  <p className="text-xs text-gray-500">
                    {forum.memberCount.toLocaleString()} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Post card component
function PostCard({
  post,
  onVote,
}: {
  post: Post;
  onVote: (value: 1 | -1) => void;
}) {
  return (
    <div className="bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors">
      <div className="flex">
        {/* Vote sidebar */}
        <div className="flex flex-col items-center gap-1 p-3 bg-dark-700/50 rounded-l-lg">
          <button
            onClick={() => onVote(1)}
            className={`p-1 rounded hover:bg-dark-600 transition-colors ${
              post.myVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
            }`}
          >
            {post.myVote === 1 ? (
              <ArrowUpIconSolid className="h-5 w-5" />
            ) : (
              <ArrowUpIcon className="h-5 w-5" />
            )}
          </button>
          <span
            className={`text-sm font-medium ${
              post.myVote === 1
                ? 'text-orange-500'
                : post.myVote === -1
                ? 'text-blue-500'
                : 'text-white'
            }`}
          >
            {post.score}
          </span>
          <button
            onClick={() => onVote(-1)}
            className={`p-1 rounded hover:bg-dark-600 transition-colors ${
              post.myVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            {post.myVote === -1 ? (
              <ArrowDownIconSolid className="h-5 w-5" />
            ) : (
              <ArrowDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Link
              to={`/forums/${post.forum.slug}`}
              className="flex items-center gap-1 hover:underline"
            >
              <div className="h-5 w-5 rounded-full bg-dark-600 overflow-hidden">
                {post.forum.iconUrl ? (
                  <img src={post.forum.iconUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px]">{post.forum.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium text-gray-300">c/{post.forum.slug}</span>
            </Link>
            <span>•</span>
            <span>
              Posted by{' '}
              <Link to="#" className="hover:underline">
                u/{post.author.username}
              </Link>
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>

          {/* Title */}
          <Link to={`/forums/${post.forum.slug}/post/${post.id}`}>
            <h2 className="text-lg font-medium text-white hover:text-primary-400 transition-colors mb-2">
              {post.isPinned && (
                <span className="inline-block mr-2 px-1.5 py-0.5 bg-green-600 text-xs rounded">
                  Pinned
                </span>
              )}
              {post.isNsfw && (
                <span className="inline-block mr-2 px-1.5 py-0.5 bg-red-600 text-xs rounded">
                  NSFW
                </span>
              )}
              {post.category && (
                <span
                  className="inline-block mr-2 px-1.5 py-0.5 text-xs rounded"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </span>
              )}
              {post.title}
            </h2>
          </Link>

          {/* Preview content */}
          {post.postType === 'text' && post.content && (
            <p className="text-gray-400 text-sm line-clamp-3 mb-3">{post.content}</p>
          )}

          {post.postType === 'link' && post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 text-sm hover:underline mb-3 block truncate"
            >
              {post.linkUrl}
            </a>
          )}

          {post.postType === 'image' && post.mediaUrls?.[0] && (
            <div className="mb-3 rounded-lg overflow-hidden max-h-96">
              <img
                src={post.mediaUrls[0]}
                alt=""
                className="max-w-full h-auto object-contain"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-gray-400">
            <Link
              to={`/forums/${post.forum.slug}/post/${post.id}`}
              className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{post.commentCount} Comments</span>
            </Link>
            <button className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors">
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors">
              <BookmarkIcon className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
