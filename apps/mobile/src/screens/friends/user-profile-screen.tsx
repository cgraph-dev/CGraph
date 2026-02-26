/**
 * User profile screen displaying user details and friend actions.
 * @module screens/friends/user-profile-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { FriendsStackParamList } from '../../types';
import { Header, LoadingSpinner } from '../../components';
import { createLogger } from '../../lib/logger';

import type { UserProfile } from './user-profile-screen/types';
import { ProfileHeader } from './user-profile-screen/components/profile-header';
import { ActionButtons } from './user-profile-screen/components/action-buttons';
import { FriendOptionsMenu } from './user-profile-screen/components/friend-options-menu';
import { useProfileActions } from './user-profile-screen/hooks/use-profile-actions';
import { styles } from './user-profile-screen/styles';

const logger = createLogger('UserProfileScreen');

type RouteProps = RouteProp<FriendsStackParamList, 'UserProfile'>;

/**
 *
 */
export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { colors } = useThemeStore();
  const { userId } = route.params;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFriendMenu, setShowFriendMenu] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      const userData = response.data?.data || response.data?.user || response.data;
      logger.debug('Fetched user data:', userData?.id);
      if (!userData || !userData.id) throw new Error('Invalid user data received');
      setUser(userData);
    } catch (error) {
      logger.error('Failed to fetch user:', error);
      Alert.alert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const actions = useProfileActions({
    user,
    setUser,
    setActionLoading,
    setShowFriendMenu,
    navigation,
  });

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Profile" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader user={user} colors={colors} />

        <ActionButtons
          user={user}
          actionLoading={actionLoading}
          colors={colors}
          onSendMessage={actions.handleSendMessage}
          onSendRequest={actions.handleSendRequest}
          onCancelRequest={actions.handleCancelRequest}
          onAcceptRequest={actions.handleAcceptRequest}
          onDeclineRequest={actions.handleDeclineRequest}
          onBlockUser={actions.handleBlockUser}
          onShowFriendMenu={() => setShowFriendMenu(true)}
        />
      </ScrollView>

      <FriendOptionsMenu
        visible={showFriendMenu}
        colors={colors}
        onClose={() => setShowFriendMenu(false)}
        onInviteToForum={actions.handleInviteToForum}
        onMute={actions.handleMuteUser}
        onRemoveFriend={actions.handleRemoveFriend}
        onBlock={actions.handleBlockUser}
      />
    </View>
  );
}
