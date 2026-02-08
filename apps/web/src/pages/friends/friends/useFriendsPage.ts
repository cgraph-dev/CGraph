/**
 * Custom hook encapsulating all state and logic for the Friends page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendStore, type Friend } from '@/modules/social/store';
import { extractErrorMessage } from '@/lib/apiUtils';
import { socketManager } from '@/lib/socket';
import type { FriendsTab, TabDefinition } from './types';

export function useFriendsPage() {
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
  }, [fetchFriends, fetchPendingRequests]);

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

  return {
    // Tab state
    activeTab,
    setActiveTab,
    tabs,
    // Search
    searchQuery,
    setSearchQuery,
    // Add friend
    showAddFriend,
    setShowAddFriend,
    addFriendInput,
    setAddFriendInput,
    addFriendError,
    addFriendSuccess,
    isSubmitting,
    handleAddFriend,
    // Dropdown
    dropdownOpen,
    setDropdownOpen,
    // Data
    friends,
    filteredFriends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    clearError,
    // Actions
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    handleStartChat,
    getStatusColor,
  };
}
