import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { FriendsStackParamList, UserBasic } from '../../types';
import { Header, Avatar, Button, LoadingSpinner } from '../../components';

type RouteProps = RouteProp<FriendsStackParamList, 'UserProfile'>;

interface UserProfile extends UserBasic {
  bio?: string;
  created_at?: string;
  karma?: number;
  is_verified?: boolean;
  is_friend?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
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

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      setUser(response.data.user || response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      Alert.alert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSendRequest = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post('/api/v1/friends', { user_id: user.id });
      setUser({ ...user, friend_request_sent: true });
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user) return;
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
            name={user.display_name || user.username}
            size="xl"
            status={user.status as 'online' | 'offline'}
          />
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.display_name || user.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{user.username}
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
        </View>

        {/* Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
          {user.is_friend ? (
            <>
              <Button
                variant="primary"
                fullWidth
                onPress={async () => {
                  // Create or get existing conversation and navigate
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
                }}
              >
                Send Message
              </Button>
              <Button
                variant="outline"
                fullWidth
                onPress={handleRemoveFriend}
                loading={actionLoading}
                style={{ marginTop: 12 }}
              >
                Remove Friend
              </Button>
            </>
          ) : user.friend_request_sent ? (
            <Button variant="secondary" fullWidth disabled>
              Friend Request Sent
            </Button>
          ) : user.friend_request_received ? (
            <Button
              variant="primary"
              fullWidth
              onPress={handleSendRequest}
              loading={actionLoading}
            >
              Accept Friend Request
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onPress={handleSendRequest}
              loading={actionLoading}
            >
              Send Friend Request
            </Button>
          )}

          <Button
            variant="danger"
            fullWidth
            onPress={handleBlockUser}
            style={{ marginTop: 12 }}
          >
            Block User
          </Button>
        </View>
      </ScrollView>
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
  actionsCard: {
    padding: 16,
    borderRadius: 16,
  },
});
