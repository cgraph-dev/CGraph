/**
 * Blocked Users Screen - Mobile
 *
 * View and manage blocked users with:
 * - List of blocked users with timestamps
 * - Unblock functionality with confirmation
 * - Search/filter
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'BlockedUsers'>;
};

interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 *
 */
export default function BlockedUsersScreen({ _navigation }: Props) {
  const { colors } = useThemeStore();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const modalScaleAnim = useMemo(() => new Animated.Value(0), []);

  // Fetch blocked users
  const fetchBlockedUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await api.get('/api/v1/users/blocked');
      setBlockedUsers(response.data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.slow.ms,
        useNativeDriver: true,
      }).start();
    } catch {
      setError('Failed to load blocked users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return blockedUsers;
    const query = searchQuery.toLowerCase();
    return blockedUsers.filter(
      (block) =>
        block.blockedUser.displayName?.toLowerCase().includes(query) ||
        block.blockedUser.username?.toLowerCase().includes(query)
    );
  }, [blockedUsers, searchQuery]);

  // Handle unblock
  const handleUnblockPress = useCallback((user: BlockedUser) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
    Animated.spring(modalScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [modalScaleAnim]);

  const handleCloseModal = useCallback(() => {
    Animated.timing(modalScaleAnim, {
      toValue: 0,
      duration: durations.normal.ms,
      useNativeDriver: true,
    }).start(() => {
      setShowConfirmModal(false);
      setSelectedUser(null);
    });
  }, [modalScaleAnim]);

  const confirmUnblock = useCallback(async () => {
    if (!selectedUser) return;

    setIsUnblocking(true);
    try {
      await api.delete(`/api/v1/users/blocked/${selectedUser.blockedUserId}`);
      setBlockedUsers((prev) =>
        prev.filter((b) => b.blockedUserId !== selectedUser.blockedUserId)
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleCloseModal();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUnblocking(false);
    }
  }, [selectedUser, handleCloseModal]);

  // Render blocked user item
  const renderItem = useCallback(
    ({ item }: { item: BlockedUser }) => (
      <Animated.View
        style={[
          styles.userCard,
          { backgroundColor: colors.surface, opacity: fadeAnim },
        ]}
      >
        {/* Avatar */}
        {item.blockedUser.avatarUrl ? (
          <Image
            source={{ uri: item.blockedUser.avatarUrl }}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {item.blockedUser.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
            {item.blockedUser.displayName}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.blockedUser.username}
          </Text>
          <Text style={[styles.blockedTime, { color: colors.textTertiary }]}>
            Blocked {formatDistanceToNow(new Date(item.blockedAt), { addSuffix: true })}
          </Text>
        </View>

        {/* Unblock Button */}
        <TouchableOpacity
          onPress={() => handleUnblockPress(item)}
          style={[styles.unblockButton, { backgroundColor: colors.error + '15' }]}
        >
          <Text style={[styles.unblockText, { color: colors.error }]}>Unblock</Text>
        </TouchableOpacity>
      </Animated.View>
    ),
    [colors, fadeAnim, handleUnblockPress]
  );

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyEmoji}>🚫</Text>
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'No users found' : 'No blocked users'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Try a different search term'
            : "You haven't blocked anyone yet"}
        </Text>
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
          <Text style={styles.errorEmoji}>⚠️</Text>
        </View>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity onPress={() => fetchBlockedUsers()}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header Description */}
        <View style={styles.headerDescription}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>
            Manage users you&apos;ve blocked. Blocked users cannot message you or see your profile.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search blocked users..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsBar, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} blocked
          </Text>
          {searchQuery && filteredUsers.length !== blockedUsers.length && (
            <Text style={[styles.statsFilter, { color: colors.textTertiary }]}>
              (showing {filteredUsers.length} of {blockedUsers.length})
            </Text>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBlockedUsers(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      </SafeAreaView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCloseModal}
          style={styles.modalOverlay}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* User Preview */}
              <View style={styles.modalHeader}>
                {selectedUser?.blockedUser.avatarUrl ? (
                  <Image
                    source={{ uri: selectedUser.blockedUser.avatarUrl }}
                    style={styles.modalAvatar}
                  />
                ) : (
                  <View style={[styles.modalAvatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
                    <Text style={[styles.modalAvatarInitial, { color: colors.primary }]}>
                      {selectedUser?.blockedUser.displayName?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.modalUserInfo}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Unblock {selectedUser?.blockedUser.displayName}?
                  </Text>
                  <Text style={[styles.modalUsername, { color: colors.textSecondary }]}>
                    @{selectedUser?.blockedUser.username}
                  </Text>
                </View>
              </View>

              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                They will be able to send you messages and view your profile again. You can block
                them again at any time.
              </Text>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmUnblock}
                  disabled={isUnblocking}
                  style={[styles.modalUnblockButton, { backgroundColor: colors.error }]}
                >
                  {isUnblocking ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalUnblockText}>Unblock</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDescription: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 14,
    padding: 4,
    color: '#888',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
  },
  statsFilter: {
    fontSize: 12,
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    marginBottom: 2,
  },
  blockedTime: {
    fontSize: 11,
  },
  unblockButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 28,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  modalAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalUsername: {
    fontSize: 14,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalUnblockButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalUnblockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
