import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { UserBasic, FriendsStackParamList } from '../../types';
import { EmptyState, LoadingSpinner, UserListItem } from '../../components';

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList>;

interface FriendItem {
  id: string;
  user: UserBasic;
}

export default function FriendListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  // Track online friends for real-time status
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends');
      const friendsList = response.data.friends || response.data || [];
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      // Use /friends/pending endpoint which returns incoming requests
      const response = await api.get('/api/v1/friends/pending');
      // API returns { data: [...], meta: {...} }
      const requests = response.data?.data || response.data?.requests || [];
      // Ensure requests is an array
      if (!Array.isArray(requests)) {
        setPendingCount(0);
        return;
      }
      // All returned requests are incoming/pending
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
  
  // Subscribe to global friend presence updates
  useEffect(() => {
    // Initialize with current online friends
    setOnlineFriends(new Set(socketManager.getOnlineFriends()));
    
    // Subscribe to status changes
    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline) => {
      setOnlineFriends(prev => {
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
  
  // Fetch presence for all friends when friend list changes
  useEffect(() => {
    if (friends.length > 0) {
      const friendUserIds = friends.map(f => f.user.id).filter(Boolean);
      if (friendUserIds.length > 0) {
        socketManager.getBulkFriendStatus(friendUserIds).then(presenceMap => {
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
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  const handleFriendPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderFriend = ({ item }: { item: FriendItem }) => {
    // Determine online status from presence
    const isOnline = onlineFriends.has(item.user.id);
    const userWithStatus = {
      ...item.user,
      status: isOnline ? 'online' : (item.user.status || 'offline')
    };
    
    return (
      <UserListItem
        user={userWithStatus}
        subtitle={`@${item.user.username || item.user.id?.slice(0, 8) || 'unknown'}`}
        onPress={() => handleFriendPress(item.user.id)}
        showStatus={true}
        style={styles.friendItem}
      />
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search friends..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Friend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <Ionicons name="mail" size={20} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Requests
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F59E0B20' }]}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
            Top Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? 'No friends found' : 'No friends yet'}
            description={
              searchQuery
                ? 'Try a different search term'
                : "Add friends to start chatting!"
            }
            actionText={searchQuery ? undefined : 'Add Friend'}
            onAction={searchQuery ? undefined : () => navigation.navigate('AddFriend')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  friendItem: {
    marginBottom: 10,
  },
});
