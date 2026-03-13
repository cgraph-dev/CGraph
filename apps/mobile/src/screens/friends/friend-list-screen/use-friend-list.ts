import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import api from '../../../lib/api';
import socketManager from '../../../lib/socket';
import type { FriendItem } from './types';

/** Description. */
/** Hook for friend list. */
export function useFriendList() {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends');
      const rawFriends = response.data?.friends || response.data || [];
      const friendsList = Array.isArray(rawFriends) ? rawFriends : [];
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      setFriends([]);
      setFilteredFriends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends/pending');
      const requests = response.data?.data || response.data?.requests || [];
      if (!Array.isArray(requests)) {
        setPendingCount(0);
        return;
      }
      setPendingCount(requests.length);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  useEffect(() => {
    setOnlineFriends(new Set(socketManager.getOnlineFriends()));

    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline) => {
      setOnlineFriends((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      const friendUserIds = friends.map((f) => f.user.id).filter(Boolean);
      if (friendUserIds.length > 0) {
        socketManager.getBulkFriendStatus(friendUserIds).then((presenceMap) => {
          const online = new Set<string>();
          Object.entries(presenceMap).forEach(([userId, data]) => {
            if (data.online && !data.hidden) {
              online.add(userId);
            }
          });
          setOnlineFriends(online);
        });
      }
    }
  }, [friends]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (f) =>
            (f.user.username?.toLowerCase() || '').includes(query) ||
            (f.user.display_name?.toLowerCase() || '').includes(query)
        )
      );
    }
  }, [searchQuery, friends]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  const onlineCount = friends.filter((f) => onlineFriends.has(f.user.id)).length;

  return {
    friends,
    filteredFriends,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    pendingCount,
    onlineFriends,
    onlineCount,
    onRefresh,
  };
}
