import { useState, useEffect } from 'react';
import { useFriendStore, Friend, FriendRequest } from '@/stores/friendStore';
import { extractErrorMessage } from '@/lib/apiUtils';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import UserProfileCard from '@/components/profile/UserProfileCard';
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
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (isSubmitting) return; // Prevent double-clicks
    setIsSubmitting(true);

    try {
      await sendRequest(addFriendInput.trim());
      setAddFriendSuccess(true);
      setAddFriendInput('');
      setTimeout(() => setAddFriendSuccess(false), 3000);
    } catch (err: unknown) {
      // Extract error message from axios error response or use store error
      let errorMsg = extractErrorMessage(err, error || 'Failed to send friend request');
      // Map technical messages to user-friendly ones
      if (errorMsg.includes('Idempotency-Key') || errorMsg.includes('idempotency')) {
        errorMsg = 'Please wait a moment before trying again';
      }
      setAddFriendError(errorMsg);
    } finally {
      setIsSubmitting(false);
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
    <div className="flex flex-1 h-full overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Friends List Panel */}
      <div className="w-96 bg-dark-900/50 backdrop-blur-xl border-r border-primary-500/20 flex flex-col overflow-hidden relative">
        {/* Ambient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Header */}
        <div className="p-4 border-b border-primary-500/20 relative z-10">
          <motion.div
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-primary-400" />
              Friends
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowAddFriend(!showAddFriend);
                HapticFeedback.medium();
              }}
              className="p-2 rounded-xl hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all group"
              title="Add Friend"
            >
              <UserPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
                className="mb-4"
              >
                <form onSubmit={handleAddFriend}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addFriendInput}
                      onChange={(e) => setAddFriendInput(e.target.value)}
                      placeholder="Enter username..."
                      className="flex-1 px-3 py-2 bg-dark-800/50 border border-primary-500/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isLoading || isSubmitting}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </motion.button>
                  </div>
                  <AnimatePresence mode="wait">
                    {addFriendError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-red-400"
                      >
                        {addFriendError}
                      </motion.p>
                    )}
                    {addFriendSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-2 text-xs text-green-400"
                      >
                        Friend request sent!
                      </motion.p>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
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
                  delay: 0.15 + index * 0.05,
                }}
              >
                <motion.button
                  onClick={() => {
                    setActiveTab(tab.id);
                    HapticFeedback.light();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="friendsTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-lg"
                      style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                  <span className={`relative z-10 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                  <AnimatePresence mode="wait">
                    {tab.count > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`relative z-10 px-1.5 py-0.5 rounded-full text-xs ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                            : 'bg-dark-600 text-gray-400'
                        }`}
                      >
                        {tab.count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          {/* Search */}
          <AnimatePresence>
            {(activeTab === 'all' || activeTab === 'online') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3"
              >
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-9 pr-4 py-2 bg-dark-800/50 border border-primary-500/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all backdrop-blur-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto min-h-0 relative z-10">
          {error && (
            <div className="m-4 p-3 bg-red-900/20 border border-red-700/50 rounded-xl text-red-400 text-sm">
              <p>{error}</p>
              <button onClick={clearError} className="mt-1 text-xs underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          {isLoading && (
            <motion.div className="flex items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}

          {!isLoading && activeTab === 'pending' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3">
              {pendingRequests.length > 0 && (
                <div className="mb-4">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider mb-2 px-1"
                  >
                    Incoming — {pendingRequests.length}
                  </motion.h3>
                  <div className="space-y-2">
                    {pendingRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
                      >
                        <FriendRequestCard request={request} type="incoming" onAccept={() => acceptRequest(request.id)} onDecline={() => declineRequest(request.id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {sentRequests.length > 0 && (
                <div>
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pendingRequests.length * 0.05 }}
                    className="text-xs font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider mb-2 px-1"
                  >
                    Sent — {sentRequests.length}
                  </motion.h3>
                  <div className="space-y-2">
                    {sentRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: (pendingRequests.length + index) * 0.05 }}
                      >
                        <FriendRequestCard request={request} type="outgoing" onDecline={() => declineRequest(request.id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {pendingRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No pending requests</p>
                </div>
              )}
            </motion.div>
          )}

          {!isLoading && (activeTab === 'all' || activeTab === 'online') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filteredFriends.length > 0 ? (
                <div>
                  {filteredFriends.map((friend, index) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
                    >
                      <FriendListItem
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
                <div className="text-center py-12 px-4">
                  <UserPlusIcon className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? 'No friends found' : 'No friends yet'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {!isLoading && activeTab === 'blocked' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 px-4">
              <NoSymbolIcon className="h-12 w-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No blocked users</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Welcome Panel - Right Side */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.div
          className="flex-1 flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Ambient particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.1,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}

          <motion.div
            className="text-center relative z-10"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="relative inline-block mb-6">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto backdrop-blur-sm border border-primary-500/30 shadow-2xl">
                <HeartIcon className="h-12 w-12 text-primary-400" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-purple-400/20"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute -inset-4 rounded-3xl border border-primary-400/20"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
            </div>

            <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
              Your Friends
              <SparklesIcon className="h-6 w-6 text-primary-400 animate-pulse" />
            </h3>
            <p className="text-gray-400 max-w-md text-lg">
              Connect with your friends, start conversations, and stay in touch
            </p>

            <motion.div
              className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShieldCheckIcon className="h-4 w-4 text-primary-500" />
              Your friendships are private
            </motion.div>

            {/* Stats cards */}
            <motion.div
              className="mt-8 flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.2)" className="px-6 py-3">
                <p className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                  {friends.length}
                </p>
                <p className="text-xs text-gray-400">Friends</p>
              </GlassCard>
              <GlassCard variant="holographic" glow glowColor="rgba(168, 85, 247, 0.2)" className="px-6 py-3">
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {pendingRequests.length}
                </p>
                <p className="text-xs text-gray-400">Requests</p>
              </GlassCard>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Friend List Item Component (compact version for sidebar)
interface FriendListItemProps {
  friend: Friend;
  statusColor: string;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

function FriendListItem({
  friend,
  statusColor,
  onMessage,
  onRemove,
  onBlock,
  dropdownOpen,
  setDropdownOpen,
}: FriendListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group relative cursor-pointer ${
        isHovered ? 'bg-primary-500/10' : 'hover:bg-primary-500/5'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        HapticFeedback.selection();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onMessage()}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Avatar */}
      <UserProfileCard
        userId={friend.id}
        trigger="both"
        className="cursor-pointer"
      >
        <div className="relative flex-shrink-0">
          {friend.avatarUrl ? (
            <img
              src={friend.avatarUrl}
              alt={friend.username}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-dark-700"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium ring-2 ring-dark-700">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
          <motion.span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColor} ring-2 ring-dark-900`}
            animate={
              friend.status === 'online'
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(34, 197, 94, 0.7)',
                      '0 0 0 4px rgba(34, 197, 94, 0)',
                    ],
                  }
                : {}
            }
            transition={friend.status === 'online' ? { duration: 2, repeat: Infinity } : {}}
          />
        </div>
      </UserProfileCard>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white truncate">
          {friend.displayName || friend.username}
        </p>
        <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" onClick={(e) => e.stopPropagation()}>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onMessage();
            HapticFeedback.medium();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 hover:bg-primary-600/20 rounded-lg transition-all"
          title="Send Message"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 hover:text-primary-400 transition-colors" />
        </motion.button>
        <div className="relative">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <EllipsisVerticalIcon className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
          </motion.button>
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 z-20"
                >
                  <GlassCard variant="neon" className="py-1 min-w-[140px]">
                    <button
                      onClick={() => {
                        onRemove();
                        setDropdownOpen(false);
                        HapticFeedback.medium();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-dark-600/50 flex items-center gap-2 transition-colors"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                      Remove
                    </button>
                    <button
                      onClick={() => {
                        onBlock();
                        setDropdownOpen(false);
                        HapticFeedback.medium();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                    >
                      <NoSymbolIcon className="h-4 w-4" />
                      Block
                    </button>
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
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
            <UserProfileCard
              userId={request.user?.id || ''}
              trigger="both"
              className="cursor-pointer"
            >
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
            </UserProfileCard>
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
