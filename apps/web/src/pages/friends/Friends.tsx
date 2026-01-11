import { useState, useEffect } from 'react';
import { useFriendStore, Friend, FriendRequest } from '@/stores/friendStore';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  NoSymbolIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

type Tab = 'all' | 'online' | 'pending' | 'blocked';

export default function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    clearError,
  } = useFriendStore();

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  const tabs = [
    { id: 'all' as Tab, label: 'All', count: friends.length },
    // Note: "Online" tab disabled - requires global presence tracking implementation
    // Database status field is never updated and shows stale data
    // { id: 'online' as Tab, label: 'Online', count: 0 },
    { id: 'pending' as Tab, label: 'Pending', count: pendingRequests.length + sentRequests.length },
    { id: 'blocked' as Tab, label: 'Blocked', count: 0 },
  ];

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Online filtering disabled until global presence tracking is implemented
    // if (activeTab === 'online') {
    //   return matchesSearch && friend.status === 'online';
    // }

    return matchesSearch;
  });

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess(false);

    if (!addFriendInput.trim()) {
      setAddFriendError('Please enter a username');
      return;
    }

    try {
      await sendRequest(addFriendInput.trim());
      setAddFriendSuccess(true);
      setAddFriendInput('');
      setTimeout(() => setAddFriendSuccess(false), 3000);
    } catch {
      setAddFriendError(error || 'Failed to send friend request');
    }
  };

  const handleStartChat = (friendId: string) => {
    // Navigate to or create a conversation with this friend
    navigate(`/messages?userId=${friendId}`);
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Header */}
      <div className="border-b border-primary-500/20 px-6 py-4 relative z-10 bg-dark-900/30 backdrop-blur-sm">
        <motion.div
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary-400" />
            Friends
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowAddFriend(!showAddFriend);
              HapticFeedback.medium();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-500/20"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add Friend
          </motion.button>
        </motion.div>

        {/* Add Friend Form */}
        <AnimatePresence>
          {showAddFriend && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard variant="crystal" glow className="p-4 mb-4">
                <form onSubmit={handleAddFriend}>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={addFriendInput}
                        onChange={(e) => setAddFriendInput(e.target.value)}
                        placeholder="Enter a username to add as friend"
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <AnimatePresence mode="wait">
                        {addFriendError && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 text-sm text-red-400"
                          >
                            {addFriendError}
                          </motion.p>
                        )}
                        {addFriendSuccess && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 text-sm text-green-400"
                          >
                            Friend request sent!
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isLoading}
                      onClick={() => HapticFeedback.medium()}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20"
                    >
                      Send Request
                    </motion.button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.25 + index * 0.05,
              }}
            >
              <motion.button
                onClick={() => {
                  setActiveTab(tab.id);
                  HapticFeedback.light();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-md"
                    style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                )}
                <span className={`relative z-10 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                <AnimatePresence mode="wait">
                  {tab.count > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`relative z-10 px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                          : 'bg-dark-600 text-gray-400'
                      }`}
                      style={
                        activeTab === tab.id
                          ? { boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }
                          : {}
                      }
                    >
                      {tab.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {(activeTab === 'all' || activeTab === 'online') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-3 border-b border-primary-500/20 bg-dark-900/20 backdrop-blur-sm relative z-10"
          >
            <GlassCard variant="crystal" className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none relative z-10"
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            <p>{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Incoming Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider mb-2"
                >
                  Incoming Requests — {pendingRequests.length}
                </motion.h3>
                <div className="space-y-2">
                  {pendingRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <FriendRequestCard
                        request={request}
                        type="incoming"
                        onAccept={() => acceptRequest(request.id)}
                        onDecline={() => declineRequest(request.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {sentRequests.length > 0 && (
              <div>
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pendingRequests.length * 0.05 }}
                  className="text-xs font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider mb-2"
                >
                  Sent Requests — {sentRequests.length}
                </motion.h3>
                <div className="space-y-2">
                  {sentRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: (pendingRequests.length + index) * 0.05,
                      }}
                    >
                      <FriendRequestCard
                        request={request}
                        type="outgoing"
                        onDecline={() => declineRequest(request.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <EmptyState
                icon={<ClockIcon className="h-12 w-12" />}
                title="No pending requests"
                description="When you receive or send friend requests, they'll appear here."
              />
            )}
          </motion.div>
        )}

        {!isLoading && (activeTab === 'all' || activeTab === 'online') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {filteredFriends.length > 0 ? (
              <div className="space-y-2">
                {filteredFriends.map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.05,
                    }}
                  >
                    <FriendCard
                      friend={friend}
                      statusColor={getStatusColor(friend.status)}
                      onMessage={() => handleStartChat(friend.id)}
                      onRemove={() => removeFriend(friend.id)}
                      onBlock={() => blockUser(friend.id)}
                      dropdownOpen={dropdownOpen === friend.id}
                      setDropdownOpen={(open) => setDropdownOpen(open ? friend.id : null)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UserPlusIcon className="h-12 w-12" />}
                title={searchQuery ? 'No friends found' : 'No friends yet'}
                description={
                  searchQuery
                    ? 'Try a different search term.'
                    : "Add friends by clicking the 'Add Friend' button above."
                }
              />
            )}
          </motion.div>
        )}

        {!isLoading && activeTab === 'blocked' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <EmptyState
              icon={<NoSymbolIcon className="h-12 w-12" />}
              title="No blocked users"
              description="Users you block will appear here. You can unblock them at any time."
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Friend Card Component
interface FriendCardProps {
  friend: Friend;
  statusColor: string;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

function FriendCard({
  friend,
  statusColor,
  onMessage,
  onRemove,
  onBlock,
  dropdownOpen,
  setDropdownOpen,
}: FriendCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard
        variant="default"
        className="group relative overflow-hidden"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Hover gradient glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-center justify-between p-3 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {friend.avatarUrl ? (
                <div className="p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
                  <img
                    src={friend.avatarUrl}
                    alt={friend.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Pulsing status indicator */}
              <motion.span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColor} ring-2 ring-dark-900`}
                animate={
                  friend.status === 'online'
                    ? {
                        boxShadow: [
                          '0 0 0 0 rgba(34, 197, 94, 0.7)',
                          '0 0 0 6px rgba(34, 197, 94, 0)',
                        ],
                      }
                    : {}
                }
                transition={
                  friend.status === 'online'
                    ? { duration: 2, repeat: Infinity }
                    : {}
                }
              />
            </motion.div>
            <div>
              <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                {friend.displayName || friend.username}
              </p>
              <p className="text-sm text-gray-400">@{friend.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              onClick={() => {
                onMessage();
                HapticFeedback.medium();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-dark-700/50 hover:bg-primary-600/20 rounded-lg transition-all group/btn"
              title="Send Message"
            >
              <ChatBubbleLeftRightIcon
                className="h-5 w-5 text-gray-400 group-hover/btn:text-primary-400 transition-colors"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0))' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 0 4px rgba(16, 185, 129, 0))';
                }}
              />
            </motion.button>
            <div className="relative">
              <motion.button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  HapticFeedback.light();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-dark-700/50 hover:bg-dark-600 rounded-lg transition-colors"
              >
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
              </motion.button>
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <GlassCard
                        variant="frosted"
                        className="absolute right-0 top-full mt-1 w-48 shadow-lg z-20 py-1"
                      >
                        <button
                          onClick={() => {
                            onRemove();
                            setDropdownOpen(false);
                            HapticFeedback.medium();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-600/50 hover:text-white transition-colors rounded-md"
                        >
                          <UserMinusIcon className="h-4 w-4" />
                          Remove Friend
                        </button>
                        <button
                          onClick={() => {
                            onBlock();
                            setDropdownOpen(false);
                            HapticFeedback.medium();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors rounded-md"
                        >
                          <NoSymbolIcon className="h-4 w-4" />
                          Block User
                        </button>
                      </GlassCard>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Friend Request Card Component
interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline: () => void;
}

function FriendRequestCard({ request, type, onAccept, onDecline }: FriendRequestCardProps) {
  // Defensive null check for user data
  const user = request.user || { username: 'Unknown', displayName: null, avatarUrl: null };
  const username = user.username || 'Unknown';
  const displayName = user.displayName || username;
  const avatarUrl = user.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard
        variant="crystal"
        className="relative overflow-hidden group"
        style={{
          boxShadow: type === 'incoming'
            ? '0 4px 20px rgba(16, 185, 129, 0.2)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Animated border for incoming requests */}
        {type === 'incoming' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent pointer-events-none"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="flex items-center justify-between p-3 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {avatarUrl ? (
                <div className="p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
            <div>
              <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                {displayName}
              </p>
              <p className="text-sm text-gray-400">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === 'incoming' && onAccept && (
              <motion.button
                onClick={() => {
                  onAccept();
                  HapticFeedback.success();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all group/btn"
                style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)' }}
                title="Accept"
              >
                <CheckIcon
                  className="h-5 w-5 text-white"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))' }}
                />
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                onDecline();
                HapticFeedback.medium();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-dark-700/50 hover:bg-red-600/20 rounded-lg transition-all group/btn"
              title={type === 'incoming' ? 'Decline' : 'Cancel'}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 group-hover/btn:text-red-400 transition-colors" />
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center justify-center py-12 text-center relative"
    >
      {/* Floating particles around icon */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 15}%`,
            top: `${35 + Math.sin((i * Math.PI * 2) / 6) * 15}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Rotating icon with holographic effect */}
      <motion.div
        className="relative mb-4"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GlassCard
          variant="holographic"
          glow
          glowColor="rgba(16, 185, 129, 0.3)"
          className="p-6"
        >
          <div className="text-primary-400">{icon}</div>
        </GlassCard>

        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-primary-500/30 pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-medium bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 max-w-sm"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
