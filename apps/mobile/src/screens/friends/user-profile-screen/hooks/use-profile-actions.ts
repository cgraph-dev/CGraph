/**
 * Hook encapsulating all user profile action handlers.
 * @module screens/friends/user-profile-screen/hooks/use-profile-actions
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import api from '../../../../lib/api';
import { createLogger } from '../../../../lib/logger';
import type { UserProfile } from '../types';

const logger = createLogger('useProfileActions');

interface UseProfileActionsParams {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setActionLoading: (loading: boolean) => void;
  setShowFriendMenu: (show: boolean) => void;
  navigation: { goBack: () => void; dispatch: (action: unknown) => void };
}

export function useProfileActions({
  user,
  setUser,
  setActionLoading,
  setShowFriendMenu,
  navigation,
}: UseProfileActionsParams) {
  const handleSendMessage = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.post('/api/v1/conversations', { participant_ids: [user.id] });
      const conversationId = response.data.data?.id || response.data.id;
      navigation.dispatch(
        CommonActions.navigate({ name: 'MessagesTab', params: { screen: 'Conversation', params: { conversationId } } })
      );
    } catch {
      Alert.alert('Error', 'Could not start conversation');
    }
  }, [user, navigation]);

  const handleSendRequest = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post('/api/v1/friends', { user_id: user.id });
      setUser({ ...user, friend_request_sent: true });
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      let errorMessage = typeof error.response?.data?.error === 'object'
        ? error.response?.data?.error?.message : error.response?.data?.error;
      if (errorMessage?.includes('Idempotency-Key') || errorMessage?.includes('idempotency')) {
        errorMessage = 'Please wait a moment before trying again';
      }
      Alert.alert('Error', errorMessage || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  }, [user, setUser, setActionLoading]);

  const handleCancelRequest = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/v1/friends/${user.id}`);
      setUser({ ...user, friend_request_sent: false, friend_request_received: false });
      Alert.alert('Cancelled', 'Friend request cancelled');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  }, [user, setUser, setActionLoading]);

  const handleAcceptRequest = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/friends/${user.id}/accept`);
      setUser({ ...user, is_friend: true, friend_request_received: false });
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      const errorMessage = typeof error.response?.data?.error === 'object'
        ? error.response?.data?.error?.message : error.response?.data?.error;
      Alert.alert('Error', errorMessage || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  }, [user, setUser, setActionLoading]);

  const handleDeclineRequest = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/friends/${user.id}/decline`);
      setUser({ ...user, friend_request_received: false });
      Alert.alert('Declined', 'Friend request declined');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to decline request');
    } finally {
      setActionLoading(false);
    }
  }, [user, setUser, setActionLoading]);

  const handleRemoveFriend = useCallback(async () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${user.display_name || user.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.delete(`/api/v1/friends/${user.id}`);
              setUser({ ...user, is_friend: false });
            } catch { Alert.alert('Error', 'Failed to remove friend'); }
            finally { setActionLoading(false); }
          },
        },
      ]
    );
  }, [user, setUser, setActionLoading, setShowFriendMenu]);

  const handleBlockUser = useCallback(async () => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user.display_name || user.username}? They won't be able to message you or send friend requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block', style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.post(`/api/v1/friends/${user.id}/block`);
              Alert.alert('Blocked', 'User has been blocked');
              navigation.goBack();
            } catch { Alert.alert('Error', 'Failed to block user'); }
            finally { setActionLoading(false); }
          },
        },
      ]
    );
  }, [user, setActionLoading, setShowFriendMenu, navigation]);

  const handleMuteUser = useCallback(() => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert('Muted', `${user.display_name || user.username} has been muted. You won't receive notifications from them.`);
  }, [user, setShowFriendMenu]);

  const handleInviteToForum = useCallback(() => {
    if (!user) return;
    setShowFriendMenu(false);
    Alert.alert('Invite to Forum', 'This feature is coming soon!');
  }, [user, setShowFriendMenu]);

  return {
    handleSendMessage,
    handleSendRequest,
    handleCancelRequest,
    handleAcceptRequest,
    handleDeclineRequest,
    handleRemoveFriend,
    handleBlockUser,
    handleMuteUser,
    handleInviteToForum,
  };
}
