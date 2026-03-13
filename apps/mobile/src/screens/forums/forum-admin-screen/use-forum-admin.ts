import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../../../lib/api';
import type {
  ModerationItem,
  BannedUser,
  Moderator,
  ForumStats,
  UserBasic,
  ModerationLogEntry,
  IdentityCardEntry,
} from './types';

/** Description. */
/** Hook for forum admin. */
export function useForumAdmin(forumId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [modQueue, setModQueue] = useState<ModerationItem[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLogEntry[]>([]);
  const [identityCards, setIdentityCards] = useState<IdentityCardEntry[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBasic | null>(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, modQueueRes, bannedRes, modsRes, logsRes, identityRes] = await Promise.all([
        api.get(`/api/v1/forums/${forumId}/admin/stats`).catch(() => ({ data: { data: null } })),
        api.get(`/api/v1/forums/${forumId}/modqueue`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/v1/forums/${forumId}/admin/banned`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/v1/forums/${forumId}/admin/moderators`).catch(() => ({ data: { data: [] } })),
        api
          .get(`/api/v1/forums/${forumId}/admin/moderation-logs`)
          .catch(() => ({ data: { data: [] } })),
        api
          .get(`/api/v1/forums/${forumId}/admin/identity-cards`)
          .catch(() => ({ data: { data: [] } })),
      ]);

      setStats(
        statsRes.data?.data || {
          total_posts: 0,
          total_comments: 0,
          total_members: 0,
          pending_reports: 0,
          posts_today: 0,
          active_users_24h: 0,
        }
      );
      setModQueue(modQueueRes.data?.data || []);
      setBannedUsers(bannedRes.data?.data || []);
      setModerators(modsRes.data?.data || []);
      setModerationLogs(logsRes.data?.data || []);
      setIdentityCards(identityRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumId]);

  const handleApprove = async (item: ModerationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/api/v1/forums/${forumId}/modqueue/${item.id}/approve`);
      setModQueue((prev) => prev.filter((i) => i.id !== item.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_error) {
      Alert.alert('Error', 'Failed to approve item');
    }
  };

  const handleRemove = async (item: ModerationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Remove Content', 'Are you sure you want to remove this content?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/api/v1/forums/${forumId}/modqueue/${item.id}/remove`);
            setModQueue((prev) => prev.filter((i) => i.id !== item.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (_error) {
            Alert.alert('Error', 'Failed to remove item');
          }
        },
      },
    ]);
  };

  const handleUnban = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.delete(`/api/v1/forums/${forumId}/admin/banned/${userId}`);
      setBannedUsers((prev) => prev.filter((u) => u.user.id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_error) {
      Alert.alert('Error', 'Failed to unban user');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the ban');
      return;
    }
    try {
      await api.post(`/api/v1/forums/${forumId}/admin/ban`, {
        user_id: selectedUser.id,
        reason: banReason,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      fetchAdminData();
    } catch (_error) {
      Alert.alert('Error', 'Failed to ban user');
    }
  };

  return {
    isLoading,
    refreshing,
    stats,
    modQueue,
    bannedUsers,
    moderators,
    moderationLogs,
    identityCards,
    showBanModal,
    setShowBanModal,
    banReason,
    setBanReason,
    selectedUser,
    setSelectedUser,
    fetchAdminData,
    onRefresh,
    handleApprove,
    handleRemove,
    handleUnban,
    handleBanUser,
  };
}
