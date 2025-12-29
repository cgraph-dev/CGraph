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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
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
      const response = await api.get('/api/v1/friends/pending');
      const requests = response.data.requests || response.data || [];
      const incoming = requests.filter((r: { type: string }) => r.type === 'incoming');
      setPendingCount(incoming.length);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (f) =>
            f.user.username.toLowerCase().includes(query) ||
            f.user.display_name?.toLowerCase().includes(query)
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

  const renderFriend = ({ item }: { item: FriendItem }) => (
    <UserListItem
      user={item.user}
      subtitle={`@${item.user.username}`}
      onPress={() => handleFriendPress(item.user.id)}
      style={styles.friendItem}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
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
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  friendItem: {
    marginBottom: 8,
  },
});
