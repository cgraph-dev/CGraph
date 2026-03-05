/**
 * UserCardSheet — mobile bottom sheet version of Discord user card popover.
 * @module components/user-card-sheet
 */
import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Avatar } from './ui/avatar';
import { space, radius } from '../theme/tokens';

interface UserCardData {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bannerColor?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: { emoji?: string; text: string };
  bio?: string;
  mutualFriends?: number;
}

interface UserCardSheetProps {
  user: UserCardData | null;
  visible: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onAddFriend?: () => void;
}

export const UserCardSheet = memo(function UserCardSheet({
  user,
  visible,
  onClose,
  onMessage,
  onAddFriend,
}: UserCardSheetProps) {
  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage?.();
    onClose();
  }, [onMessage, onClose]);

  const handleAddFriend = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddFriend?.();
    onClose();
  }, [onAddFriend, onClose]);

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: user.bannerColor ?? '#5865F2' }]} />

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Avatar
              size="xl"
              name={user.displayName}
              src={user.avatarUrl}
              status={user.status}
            />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.username}>@{user.username}</Text>

            {user.customStatus && (
              <Text style={styles.customStatus}>
                {user.customStatus.emoji} {user.customStatus.text}
              </Text>
            )}

            {user.bio && (
              <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
            )}

            {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
              <Text style={styles.mutual}>
                {user.mutualFriends} mutual friend{user.mutualFriends > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={handleMessage} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Message</Text>
            </Pressable>
            <Pressable onPress={handleAddFriend} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Add Friend</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgb(18,18,24)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  banner: {
    height: 60,
    width: '100%',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -30,
  },
  info: {
    alignItems: 'center',
    padding: space[4],
    gap: space[1],
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  customStatus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: space[1],
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: space[1],
    lineHeight: 18,
    maxWidth: 280,
  },
  mutual: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: space[2],
  },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#5865F2',
    borderRadius: radius.md,
    paddingVertical: space[2.5],
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingVertical: space[2.5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});

export default UserCardSheet;
