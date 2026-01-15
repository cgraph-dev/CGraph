import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { FriendsStackParamList, UserBasic } from '../../types';
import { Header, Avatar, Button, LoadingSpinner } from '../../components';
import { TitleBadge, LevelProgress } from '../../components/gamification';
import { createLogger } from '../../lib/logger';

const logger = createLogger('UserProfileScreen');

type RouteProps = RouteProp<FriendsStackParamList, 'UserProfile'>;

interface UserProfile extends UserBasic {
  bio?: string;
  created_at?: string;
  karma?: number;
  is_verified?: boolean;
  is_friend?: boolean;
  is_profile_private?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
  // Gamification fields
  level?: number;
  xp?: number;
  achievements_count?: number;
  titles?: string[];
  current_title?: string;
  streak?: number;
}

const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { colors } = useTheme();
  const { userId } = route.params;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      // API returns { data: { id, username, display_name, ... } }
      const userData = response.data?.data || response.data?.user || response.data;
      logger.debug('Fetched user data:', userData?.id);
      
      if (!userData || !userData.id) {
        throw new Error('Invalid user data received');
      }
      
      setUser(userData);
    } catch (error) {
      logger.error('Failed to fetch user:', error);
      Alert.alert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSendMessage = async () => {
    if (!user) return;
    try {
      const response = await api.post('/api/v1/conversations', {
        participant_ids: [user.id],
      });
      const conversationId = response.data.data?.id || response.data.id;
      navigation.dispatch(
        CommonActions.navigate({
          name: 'MessagesTab',
          params: {
            screen: 'Conversation',
            params: { conversationId },
          },
        })
      );
    } catch (error) {
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  const handleSendRequest = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post('/api/v1/friends', { user_id: user.id });
      setUser({ ...user, friend_request_sent: true });
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      let errorMessage = typeof error.response?.data?.error === 'object'
        ? error.response?.data?.error?.message
        : error.response?.data?.error;
      // Map technical messages to user-friendly ones
      if (errorMessage?.includes('Idempotency-Key') || errorMessage?.includes('idempotency')) {
        errorMessage = 'Please wait a moment before trying again';
      }
      Alert.alert('Error', errorMessage || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/v1/friends/requests/${user.id}`);
      setUser({ ...user, friend_request_sent: false });
      Alert.alert('Cancelled', 'Friend request cancelled');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/friends/requests/${user.id}/accept`);
      setUser({ ...user, is_friend: true, friend_request_received: false });
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      const errorMessage = typeof error.response?.data?.error === 'object'
        ? error.response?.data?.error?.message
        : error.response?.data?.error;
      Alert.alert('Error', errorMessage || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${user.display_name || user.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/v1/friends/${user.id}`);
              setUser({ ...user, is_friend: false });
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user.display_name || user.username}? They won't be able to message you or send friend requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.post(`/api/v1/friends/${user.id}/block`);
              Alert.alert('Blocked', 'User has been blocked');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMuteUser = async () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert('Muted', `${user.display_name || user.username} has been muted. You won't receive notifications from them.`);
  };

  const handleInviteToForum = () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert('Invite to Forum', 'This feature is coming soon!');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Profile"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Avatar
            source={user.avatar_url}
            name={user.display_name || user.username || 'Unknown'}
            size="xl"
            status={user.status as 'online' | 'offline'}
          />
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.display_name || user.username || 'Unknown'}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{user.username || 'unknown'}
          </Text>
          
          {/* Karma & Verified Badge */}
          <View style={styles.badgesRow}>
            {user.karma !== undefined && (
              <View style={[styles.karmaBadge, { backgroundColor: colors.surfaceHover }]}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
                <Text style={[styles.karmaText, { color: colors.text }]}>
                  {formatKarma(user.karma)} karma
                </Text>
              </View>
            )}
            {user.is_verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified</Text>
              </View>
            )}
          </View>
          
          {user.bio && (
            <Text style={[styles.bio, { color: colors.text }]}>
              {user.bio}
            </Text>
          )}

          {/* Gamification Stats Section */}
          {(user.level || user.current_title || user.achievements_count) && (
            <View style={styles.gamificationSection}>
              {/* Current Title */}
              {user.current_title && (
                <View style={styles.titleContainer}>
                  <TitleBadge title={user.current_title} rarity="rare" size="md" />
                </View>
              )}
              
              {/* Level & XP */}
              {user.level && (
                <View style={styles.levelContainer}>
                  <LinearGradient
                    colors={['#8b5cf620', 'transparent']}
                    style={styles.levelGradient}
                  >
                    <View style={styles.levelHeader}>
                      <View style={styles.levelBadge}>
                        <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                        <Text style={styles.levelText}>Level {user.level}</Text>
                      </View>
                      {user.xp !== undefined && (
                        <Text style={styles.xpText}>{(user.xp ?? 0).toLocaleString()} XP</Text>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              )}
              
              {/* Stats Row */}
              <View style={styles.statsRow}>
                {user.achievements_count !== undefined && (
                  <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                    <Ionicons name="trophy" size={18} color="#f59e0b" />
                    <Text style={[styles.statValue, { color: colors.text }]}>{user.achievements_count}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Achievements</Text>
                  </View>
                )}
                {user.streak !== undefined && user.streak > 0 && (
                  <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{user.streak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                  </View>
                )}
                {user.titles && user.titles.length > 0 && (
                  <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                    <Ionicons name="ribbon" size={18} color="#ec4899" />
                    <Text style={[styles.statValue, { color: colors.text }]}>{user.titles.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Titles</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Private Profile Notice */}
          {user.is_profile_private && user.username === 'Unknown' && (
            <View style={[styles.privateNotice, { backgroundColor: colors.surfaceHover }]}>
              <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
              <Text style={[styles.privateNoticeText, { color: colors.textSecondary }]}>
                This profile is private. Send a friend request to see more info.
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
          {/* Message Button - Always show */}
          <Button
            variant="primary"
            fullWidth
            onPress={handleSendMessage}
            icon={<Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />}
          >
            Send Message
          </Button>

          {/* Friend Status Actions */}
          {user.is_friend ? (
            // Already friends - show "Friend" button with options menu
            <TouchableOpacity
              style={[styles.friendButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
              onPress={() => setShowFriendMenu(true)}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.friendButtonText, { color: colors.success }]}>Friend</Text>
              <Ionicons name="chevron-down" size={18} color={colors.success} />
            </TouchableOpacity>
          ) : user.friend_request_sent ? (
            // Request sent - show cancel option
            <Button
              variant="secondary"
              fullWidth
              onPress={handleCancelRequest}
              loading={actionLoading}
              style={{ marginTop: 12 }}
            >
              Cancel Friend Request
            </Button>
          ) : user.friend_request_received ? (
            // Request received - show accept/decline options
            <View style={styles.requestActions}>
              <Button
                variant="primary"
                fullWidth
                onPress={handleAcceptRequest}
                loading={actionLoading}
                style={{ flex: 1 }}
              >
                Accept Request
              </Button>
              <Button
                variant="outline"
                fullWidth
                onPress={handleCancelRequest}
                loading={actionLoading}
                style={{ flex: 1 }}
              >
                Decline
              </Button>
            </View>
          ) : (
            // Not friends - show add friend button
            <Button
              variant="outline"
              fullWidth
              onPress={handleSendRequest}
              loading={actionLoading}
              style={{ marginTop: 12 }}
              icon={<Ionicons name="person-add" size={18} color={colors.primary} style={{ marginRight: 8 }} />}
            >
              Send Friend Request
            </Button>
          )}

          {/* Block button - only show if not friends */}
          {!user.is_friend && (
            <Button
              variant="danger"
              fullWidth
              onPress={handleBlockUser}
              style={{ marginTop: 12 }}
            >
              Block User
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Friend Options Menu Modal */}
      <Modal
        visible={showFriendMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFriendMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Friend Options</Text>
                
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={handleInviteToForum}
                >
                  <Ionicons name="people" size={22} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Invite to Forum</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={handleMuteUser}
                >
                  <Ionicons name="notifications-off" size={22} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Mute</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={handleRemoveFriend}
                >
                  <Ionicons name="person-remove" size={22} color={colors.error} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Remove Friend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleBlockUser}
                >
                  <Ionicons name="ban" size={22} color={colors.error} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Block</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.surfaceHover }]}
                  onPress={() => setShowFriendMenu(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  username: {
    fontSize: 16,
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  karmaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  // Gamification styles
  gamificationSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  levelGradient: {
    padding: 12,
    borderRadius: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  xpText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 90,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  streakEmoji: {
    fontSize: 18,
  },
  privateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  privateNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsCard: {
    padding: 16,
    borderRadius: 16,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  friendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
