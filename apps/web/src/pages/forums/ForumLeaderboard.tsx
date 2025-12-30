import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { 
  ArrowUpIcon as ArrowUpIconSolid, 
  ArrowDownIcon as ArrowDownIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';

const sortOptions: { value: LeaderboardSort; label: string; icon: React.ElementType }[] = [
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'top', label: 'Top All Time', icon: TrophyIcon },
  { value: 'weekly', label: 'Weekly Best', icon: SparklesIcon },
  { value: 'rising', label: 'Rising', icon: ArrowTrendingUpIcon },
  { value: 'new', label: 'New', icon: ClockIcon },
  { value: 'members', label: 'Most Members', icon: UsersIcon },
];

/**
 * Forum Leaderboard Component
 * Reddit-style competitive ranking of forums by upvotes
 */
export default function ForumLeaderboard() {
  const { isAuthenticated } = useAuthStore();
  const {
    leaderboard,
    leaderboardMeta,
    topForums,
    isLoadingLeaderboard,
    fetchLeaderboard,
    fetchTopForums,
    voteForum,
  } = useForumStore();

  const [sort, setSort] = useState<LeaderboardSort>('hot');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchLeaderboard(sort, 1);
    fetchTopForums(5, 'top');
  }, [sort, fetchLeaderboard, fetchTopForums]);

  const handleVote = async (forum: Forum, value: 1 | -1) => {
    if (!isAuthenticated) {
      // Could show login modal here
      return;
    }
    await voteForum(forum.id, value);
  };

  const loadMore = () => {
    if (leaderboardMeta && leaderboardMeta.page * leaderboardMeta.perPage < leaderboardMeta.total) {
      fetchLeaderboard(sort, leaderboardMeta.page + 1);
    }
  };

  const selectedSort = sortOptions.find((s) => s.value === sort) || sortOptions[0];
  const SortIcon = selectedSort!.icon;
  const sortLabel = selectedSort!.label;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Leaderboard */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-800/95 backdrop-blur border-b border-dark-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrophyIconSolid className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Forum Competition</h1>
                <p className="text-sm text-gray-400">Vote for your favorite forums!</p>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors"
              >
                <SortIcon className="h-5 w-5" />
                <span>{sortLabel}</span>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-xl overflow-hidden z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSort(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors ${
                        sort === option.value ? 'bg-dark-600 text-primary-400' : 'text-gray-300'
                      }`}
                    >
                      <option.icon className="h-5 w-5" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="p-4 space-y-3">
          {isLoadingLeaderboard && leaderboard.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-dark-700 rounded-lg h-24" />
              ))}
            </div>
          ) : (
            <>
              {leaderboard.map((forum, index) => (
                <ForumLeaderboardCard
                  key={forum.id}
                  forum={forum}
                  rank={index + 1}
                  onVote={handleVote}
                  isAuthenticated={isAuthenticated}
                />
              ))}

              {/* Load More Button */}
              {leaderboardMeta && 
               leaderboardMeta.page * leaderboardMeta.perPage < leaderboardMeta.total && (
                <button
                  onClick={loadMore}
                  disabled={isLoadingLeaderboard}
                  className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
                >
                  {isLoadingLeaderboard ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sidebar - Top 5 All Time */}
      <div className="hidden lg:block w-80 border-l border-dark-600 overflow-y-auto">
        <div className="p-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-4">
              <TrophyIconSolid className="h-6 w-6 text-yellow-500" />
              <h3 className="font-bold text-white">Hall of Fame</h3>
            </div>

            <div className="space-y-3">
              {topForums.map((forum, index) => (
                <TopForumCard key={forum.id} forum={forum} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* About Competition */}
          <div className="mt-4 bg-dark-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-2">How It Works</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <ArrowUpIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upvote forums you love to help them climb the ranks</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowDownIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Downvote low-quality forums</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Weekly scores reset every Monday</span>
              </li>
              <li className="flex items-start gap-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Top forums get featured status</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ForumLeaderboardCardProps {
  forum: Forum;
  rank: number;
  onVote: (forum: Forum, value: 1 | -1) => void;
  isAuthenticated: boolean;
}

function ForumLeaderboardCard({ forum, rank, onVote, isAuthenticated }: ForumLeaderboardCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-yellow-500', text: 'text-yellow-900', emoji: '🥇' };
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-900', emoji: '🥈' };
    if (rank === 3) return { bg: 'bg-orange-400', text: 'text-orange-900', emoji: '🥉' };
    return { bg: 'bg-dark-600', text: 'text-gray-300', emoji: null };
  };

  const badge = getRankBadge(rank);

  return (
    <div className="flex bg-dark-700 hover:bg-dark-600 rounded-lg overflow-hidden transition-colors group">
      {/* Voting Column */}
      <div className="flex flex-col items-center justify-center w-16 bg-dark-800 p-2 gap-1">
        <button
          onClick={() => onVote(forum, 1)}
          disabled={!isAuthenticated}
          className={`p-1 rounded transition-colors ${
            forum.userVote === 1
              ? 'text-orange-500'
              : 'text-gray-500 hover:text-orange-400'
          } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
          title={isAuthenticated ? 'Upvote' : 'Login to vote'}
        >
          {forum.userVote === 1 ? (
            <ArrowUpIconSolid className="h-6 w-6" />
          ) : (
            <ArrowUpIcon className="h-6 w-6" />
          )}
        </button>
        
        <span className={`font-bold text-lg ${
          forum.score > 0 ? 'text-orange-400' : forum.score < 0 ? 'text-blue-400' : 'text-gray-400'
        }`}>
          {forum.score}
        </span>

        <button
          onClick={() => onVote(forum, -1)}
          disabled={!isAuthenticated}
          className={`p-1 rounded transition-colors ${
            forum.userVote === -1
              ? 'text-blue-500'
              : 'text-gray-500 hover:text-blue-400'
          } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
          title={isAuthenticated ? 'Downvote' : 'Login to vote'}
        >
          {forum.userVote === -1 ? (
            <ArrowDownIconSolid className="h-6 w-6" />
          ) : (
            <ArrowDownIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Rank Badge */}
      <div className="flex items-center px-3">
        <div className={`w-10 h-10 rounded-full ${badge.bg} flex items-center justify-center`}>
          {badge.emoji ? (
            <span className="text-xl">{badge.emoji}</span>
          ) : (
            <span className={`font-bold ${badge.text}`}>{rank}</span>
          )}
        </div>
      </div>

      {/* Forum Info */}
      <div className="flex-1 p-3">
        <Link 
          to={`/forums/${forum.slug}`}
          className="flex items-center gap-3"
        >
          {/* Forum Icon */}
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {forum.iconUrl ? (
              <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{forum.name?.[0]?.toUpperCase() ?? 'F'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                f/{forum.name}
              </h3>
              {forum.featured && (
                <SparklesIcon className="h-4 w-4 text-yellow-500" title="Featured Forum" />
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">{forum.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <UsersIcon className="h-3.5 w-3.5" />
                {(forum.memberCount ?? 0).toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                {(forum as any).post_count?.toLocaleString() || '0'} posts
              </span>
              <span title="Weekly score">
                📈 {forum.weeklyScore > 0 ? '+' : ''}{forum.weeklyScore} this week
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Column */}
      <div className="hidden md:flex flex-col items-end justify-center px-4 text-sm text-gray-400">
        <div className="flex items-center gap-1 text-green-400">
          <ArrowUpIcon className="h-4 w-4" />
          <span>{forum.upvotes}</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          <ArrowDownIcon className="h-4 w-4" />
          <span>{forum.downvotes}</span>
        </div>
      </div>
    </div>
  );
}

interface TopForumCardProps {
  forum: Forum;
  rank: number;
}

function TopForumCard({ forum, rank }: TopForumCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <Link
      to={`/forums/${forum.slug}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-600/50 transition-colors"
    >
      <span className={`font-bold text-lg w-6 ${getRankColor(rank)}`}>#{rank}</span>
      
      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
        {forum.iconUrl ? (
          <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">{forum.name?.[0]?.toUpperCase() ?? 'F'}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate text-sm">f/{forum.name}</p>
        <p className="text-xs text-gray-400">{(forum.score ?? 0).toLocaleString()} points</p>
      </div>
    </Link>
  );
}
