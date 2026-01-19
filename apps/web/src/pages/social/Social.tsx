import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
void UserPlusIcon; // Reserved for add friend button
void EllipsisVerticalIcon; // Reserved for context menu
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import UserProfileCard from '@/components/profile/UserProfileCard';
import { useFriendStore } from '@/stores/friendStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

/**
 * Social Hub - Unified Social Interface
 *
 * Consolidates 3 major social features into one tab:
 * 1. Friends - Friend list, requests, online status
 * 2. Notifications - All app notifications in one place
 * 3. Discover - Global search for users, forums, groups
 *
 * This replaces the old /friends, /notifications, and /search routes.
 */

// ==================== TYPE DEFINITIONS ====================

type SocialTab = 'friends' | 'notifications' | 'discover';

interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'forum_reply' | 'achievement' | 'mention';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatarUrl?: string;
}

interface SearchResult {
  id: string;
  type: 'user' | 'forum' | 'group';
  name: string;
  description: string;
  avatarUrl?: string;
  memberCount?: number;
  isJoined?: boolean;
}

// ==================== MOCK DATA ====================

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    type: 'friend_request',
    title: 'New Friend Request',
    message: 'John Doe sent you a friend request',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 'notif2',
    type: 'message',
    title: 'New Message',
    message: 'Sarah: Hey, are you free tonight?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/messages/conv123',
  },
  {
    id: 'notif3',
    type: 'forum_reply',
    title: 'Forum Reply',
    message: 'Alex replied to your post in Gaming',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/forums/gaming/post123',
  },
  {
    id: 'notif4',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You unlocked "Social Butterfly" - Made 10 friends',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'notif5',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Mike mentioned you in #general',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/groups/server123/general',
  },
];

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'user1',
    type: 'user',
    name: 'Gaming Legend',
    description: '@gaminglegend • Level 42',
  },
  {
    id: 'forum1',
    type: 'forum',
    name: 'Gaming Discussions',
    description: 'Talk about your favorite games',
    memberCount: 15420,
    isJoined: true,
  },
  {
    id: 'group1',
    type: 'group',
    name: 'Valorant Squad',
    description: 'Competitive Valorant players',
    memberCount: 847,
    isJoined: false,
  },
  {
    id: 'user2',
    type: 'user',
    name: 'Pro Gamer',
    description: '@progamer • Level 40',
  },
  {
    id: 'forum2',
    type: 'forum',
    name: 'Tech Talk',
    description: 'Technology and programming',
    memberCount: 23100,
    isJoined: false,
  },
];

// ==================== MAIN COMPONENT ====================

export default function Social() {
  const { tab = 'friends' } = useParams<{ tab: SocialTab }>();
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    declineRequest,
    clearError,
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  // Filter friends by search
  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter notifications
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      // Filter mock results by query
      const filtered = MOCK_SEARCH_RESULTS.filter(
        (result) =>
          result.name.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const tabs = [
    { id: 'friends' as SocialTab, label: 'Friends', icon: UsersIcon, count: friends.length },
    {
      id: 'notifications' as SocialTab,
      label: 'Notifications',
      icon: BellIcon,
      count: unreadNotifications.length,
    },
    { id: 'discover' as SocialTab, label: 'Discover', icon: MagnifyingGlassIcon, count: 0 },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-white/10 bg-dark-900/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Social Hub</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => navigate(`/social/${tabItem.id}`)}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tabItem.label}
                  {tabItem.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
                    >
                      {tabItem.count > 99 ? '99+' : tabItem.count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {tab === 'friends' && (
              <FriendsTab
                friends={filteredFriends}
                pendingRequests={pendingRequests}
                sentRequests={sentRequests}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAcceptRequest={acceptRequest}
                onDeclineRequest={declineRequest}
                isLoading={isLoading}
                error={error}
                onRetry={() => {
                  clearError();
                  fetchFriends();
                  fetchPendingRequests();
                }}
              />
            )}

            {tab === 'notifications' && (
              <NotificationsTab
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            )}

            {tab === 'discover' && (
              <DiscoverTab
                searchQuery={searchQuery}
                searchResults={searchResults}
                onSearchChange={handleSearch}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==================== TAB COMPONENTS ====================

interface FriendsTabProps {
  friends: any[];
  pendingRequests: any[];
  sentRequests: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function FriendsTab({
  friends,
  pendingRequests,
  sentRequests,
  searchQuery,
  onSearchChange,
  onAcceptRequest,
  onDeclineRequest,
  isLoading,
  error,
  onRetry,
}: FriendsTabProps) {
  void sentRequests; // Reserved for sent requests section
  const navigate = useNavigate();

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <GlassCard variant="frosted" className="max-w-md p-8 text-center">
          <div className="mb-4 text-5xl text-red-400">⚠️</div>
          <h3 className="mb-2 text-xl font-bold text-white">Something went wrong</h3>
          <p className="mb-6 text-gray-400">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Try Again
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  // Show loading state
  if (isLoading && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-gray-400">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search friends..."
          aria-label="Search friends"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard variant="neon" glow className="p-4">
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={request.user?.id || ''} trigger="both">
                      <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white">
                        {request.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </UserProfileCard>

                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {request.user?.displayName || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/60">
                        @{request.user?.username || 'unknown'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onAcceptRequest(request.id);
                          HapticFeedback.success();
                        }}
                        className="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
                        title="Accept"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onDeclineRequest(request.id);
                          HapticFeedback.medium();
                        }}
                        className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                        title="Decline"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="mb-3 text-lg font-bold text-white">All Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <GlassCard variant="frosted" className="p-8 text-center">
            <UsersIcon className="mx-auto mb-3 h-12 w-12 text-white/40" />
            <p className="text-white/60">No friends yet. Start adding friends to see them here!</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {friends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard
                  variant="crystal"
                  className="group cursor-pointer p-4 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={friend.id} trigger="both">
                      <div className="relative flex-shrink-0">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.username}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-dark-700"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white ring-2 ring-dark-700">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {friend.status === 'online' && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-dark-900" />
                        )}
                      </div>
                    </UserProfileCard>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="truncate text-sm text-white/60">@{friend.username}</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/messages?user=${friend.id}`);
                        HapticFeedback.medium();
                      }}
                      className="rounded-lg bg-primary-600 p-2 text-white opacity-0 transition-opacity hover:bg-primary-700 group-hover:opacity-100"
                      title="Send Message"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NotificationsTabProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function NotificationsTab({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationsTabProps) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '👥';
      case 'message':
        return '💬';
      case 'forum_reply':
        return '📝';
      case 'achievement':
        return '🏆';
      case 'mention':
        return '📢';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up!'}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <GlassCard variant="frosted" className="p-8 text-center">
          <BellIconSolid className="mx-auto mb-3 h-12 w-12 text-white/40" />
          <p className="text-white/60">No notifications yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant={notification.read ? 'frosted' : 'neon'}
                glow={!notification.read}
                className={`cursor-pointer p-4 transition-transform hover:scale-[1.01] ${
                  notification.read ? 'opacity-60' : ''
                }`}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-3xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="font-medium text-white">{notification.title}</h4>
                      <span className="ml-2 flex-shrink-0 text-xs text-white/60">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
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

interface DiscoverTabProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearchChange: (query: string) => void;
}

function DiscoverTab({ searchQuery, searchResults, onSearchChange }: DiscoverTabProps) {
  const navigate = useNavigate();

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'forum':
        return '📰';
      case 'group':
        return '👥';
      default:
        return '🔍';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users, forums, and groups..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-4 pl-14 pr-4 text-lg text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery.length === 0 ? (
        <GlassCard variant="frosted" className="p-12 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-4 h-16 w-16 text-white/40" />
          <h3 className="mb-2 text-xl font-bold text-white">Discover CGraph</h3>
          <p className="text-white/60">Search for users, forums, and groups to connect with</p>
        </GlassCard>
      ) : searchResults.length === 0 ? (
        <GlassCard variant="frosted" className="p-8 text-center">
          <p className="text-white/60">No results found for "{searchQuery}"</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <h3 className="mb-3 text-lg font-bold text-white">{searchResults.length} Results</h3>
          {searchResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant="crystal"
                className="cursor-pointer p-4 transition-transform hover:scale-[1.01]"
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
                  <div className="flex-shrink-0 text-3xl">{getResultIcon(result.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{result.name}</h4>
                    <p className="text-sm text-white/60">{result.description}</p>
                    {result.memberCount && (
                      <p className="mt-1 text-xs text-white/40">
                        {result.memberCount.toLocaleString()} members
                      </p>
                    )}
                  </div>
                  {result.type !== 'user' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        HapticFeedback.medium();
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        result.isJoined
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
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
