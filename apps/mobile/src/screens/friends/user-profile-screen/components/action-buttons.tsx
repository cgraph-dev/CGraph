/**
 * Action buttons for sending messages, friend requests, and blocking.
 * @module screens/friends/user-profile-screen/components/action-buttons
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components';
import type { UserProfile } from '../types';
import { styles } from '../styles';
import type { ThemeColors } from '@/stores';

interface ActionButtonsProps {
  user: UserProfile;
  actionLoading: boolean;
  colors: ThemeColors;
  onSendMessage: () => void;
  onSendRequest: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onDeclineRequest: () => void;
  onBlockUser: () => void;
  onShowFriendMenu: () => void;
}

export function ActionButtons({
  user,
  actionLoading,
  colors,
  onSendMessage,
  onSendRequest,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onBlockUser,
  onShowFriendMenu,
}: ActionButtonsProps) {
  return (
    <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
      <Button
        variant="primary"
        fullWidth
        onPress={onSendMessage}
        icon={<Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />}
      >
        Send Message
      </Button>

      {user.is_friend ? (
        <TouchableOpacity
          style={[styles.friendButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
          onPress={onShowFriendMenu}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.friendButtonText, { color: colors.success }]}>Friend</Text>
          <Ionicons name="chevron-down" size={18} color={colors.success} />
        </TouchableOpacity>
      ) : user.friend_request_sent ? (
        <Button variant="secondary" fullWidth onPress={onCancelRequest} loading={actionLoading} style={{ marginTop: 12 }}>
          Cancel Friend Request
        </Button>
      ) : user.friend_request_received ? (
        <View style={styles.requestActions}>
          <Button variant="primary" fullWidth onPress={onAcceptRequest} loading={actionLoading} style={{ flex: 1 }}>
            Accept Request
          </Button>
          <Button variant="outline" fullWidth onPress={onDeclineRequest} loading={actionLoading} style={{ flex: 1 }}>
            Decline
          </Button>
        </View>
      ) : (
        <Button
          variant="outline"
          fullWidth
          onPress={onSendRequest}
          loading={actionLoading}
          style={{ marginTop: 12 }}
          icon={<Ionicons name="person-add" size={18} color={colors.primary} style={{ marginRight: 8 }} />}
        >
          Send Friend Request
        </Button>
      )}

      {!user.is_friend && (
        <Button variant="danger" fullWidth onPress={onBlockUser} style={{ marginTop: 12 }}>
          Block User
        </Button>
      )}
    </View>
  );
}
