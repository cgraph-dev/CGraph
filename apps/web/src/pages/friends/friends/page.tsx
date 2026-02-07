/**
 * Friends page - main component
 * Orchestrates friend list, requests, and search functionality
 */

import { useState, useEffect } from 'react';
import { useFriendStore, Friend } from '@/stores/friendStore';
import { extractErrorMessage } from '@/lib/apiUtils';
import { motion } from 'framer-motion';
import { UserPlusIcon, NoSymbolIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { socketManager } from '@/lib/socket';

import { FriendListItem } from './friend-list-item';
import { FriendRequestCard } from './friend-request-card';
import { FriendsHeader, AddFriendForm, FriendsTabBar, FriendsSearchBar } from './header-components';
import { WelcomePanel } from './welcome-panel';
import type { FriendsTab, TabDefinition } from './types';

export default function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FriendsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  // Track online friend IDs for presence updates - value used to trigger re-renders
  const [, setOnlineFriendIds] = useState<string[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    const connectPresence = async () => {
      await socketManager.connect();
      socketManager.joinPresenceLobby();

      if (isMounted) {
        setOnlineFriendIds(socketManager.getOnlineFriends());
      }
    };

    connectPresence();

    const unsubscribe = socketManager.onStatusChange((conversationId) => {
      if (conversationId === 'lobby') {
        setOnlineFriendIds(socketManager.getOnlineFriends());
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const onlineCount = friends.filter((friend) => socketManager.isFriendOnline(friend.id)).length;

  const tabs: TabDefinition[] = [
    { id: 'all', label: 'All', count: friends.length },
    { id: 'online', label: 'Online', count: onlineCount },
    { id: 'pending', label: 'Pending', count: pendingRequests.length + sentRequests.length },
    { id: 'blocked', label: 'Blocked', count: 0 },
  ];

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'online') {
      return matchesSearch && socketManager.isFriendOnline(friend.id);
    }

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

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await sendRequest(addFriendInput.trim());
      setAddFriendSuccess(true);
      setAddFriendInput('');
      setTimeout(() => setAddFriendSuccess(false), 3000);
    } catch (err: unknown) {
      let errorMsg = extractErrorMessage(err, error || 'Failed to send friend request');
      if (errorMsg.includes('Idempotency-Key') || errorMsg.includes('idempotency')) {
        errorMsg = 'Please wait a moment before trying again';
      }
      setAddFriendError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartChat = (friendId: string) => {
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
    <div className="flex h-full flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Friends List Panel */}
      <div className="relative flex w-96 flex-col overflow-hidden border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
        {/* Ambient glow effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        {/* Header */}
        <div className="relative z-10 border-b border-primary-500/20 p-4">
          <FriendsHeader showAddFriend={showAddFriend} setShowAddFriend={setShowAddFriend} />

          <AddFriendForm
            isVisible={showAddFriend}
            addFriendInput={addFriendInput}
            setAddFriendInput={setAddFriendInput}
            onSubmit={handleAddFriend}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            addFriendError={addFriendError}
            addFriendSuccess={addFriendSuccess}
          />

          <FriendsTabBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          <FriendsSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isVisible={activeTab === 'all' || activeTab === 'online'}
          />
        </div>

        {/* Friends List */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 rounded-xl border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-400">
              <p>{error}</p>
              <button onClick={clearError} className="mt-1 text-xs underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          {isLoading && (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              {pendingRequests.length > 0 && (
                <div className="mb-4">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-2 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text px-1 text-xs font-semibold uppercase tracking-wider text-transparent"
                  >
                    Incoming — {pendingRequests.length}
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

              {sentRequests.length > 0 && (
                <div>
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pendingRequests.length * 0.05 }}
                    className="mb-2 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text px-1 text-xs font-semibold uppercase tracking-wider text-transparent"
                  >
                    Sent — {sentRequests.length}
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
                <div className="py-12 text-center">
                  <ClockIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                  <p className="text-sm text-gray-400">No pending requests</p>
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
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
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
                <div className="px-4 py-12 text-center">
                  <UserPlusIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                  <p className="text-sm text-gray-400">
                    {searchQuery ? 'No friends found' : 'No friends yet'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {!isLoading && activeTab === 'blocked' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-12 text-center"
            >
              <NoSymbolIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
              <p className="text-sm text-gray-400">No blocked users</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Welcome Panel - Right Side */}
      <WelcomePanel friendsCount={friends.length} pendingRequestsCount={pendingRequests.length} />
    </div>
  );
}
