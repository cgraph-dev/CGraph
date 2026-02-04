import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList, UserBasic } from '../../types';

// =============================================================================
// FORUM ADMIN SCREEN
// =============================================================================
// Administrative panel for forum moderators/owners:
// - Member management (ban, mute, promote)
// - Moderation queue (reported posts/comments)
// - Analytics overview
// - Banned users list
// - Moderator management
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumAdmin'>;
  route: RouteProp<ForumsStackParamList, 'ForumAdmin'>;
};

interface ModerationItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  author: UserBasic;
  reported_by: UserBasic;
  reason: string;
  created_at: string;
}

interface BannedUser {
  id: string;
  user: UserBasic;
  reason: string;
  banned_at: string;
  banned_by: UserBasic;
  expires_at?: string;
}

interface Moderator {
  id: string;
  user: UserBasic;
  permissions: string[];
  added_at: string;
}

interface ForumStats {
  total_posts: number;
  total_comments: number;
  total_members: number;
  pending_reports: number;
  posts_today: number;
  active_users_24h: number;
}

type AdminTab = 'overview' | 'modqueue' | 'banned' | 'moderators';

export default function ForumAdminScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [modQueue, setModQueue] = useState<ModerationItem[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBasic | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Admin Dashboard',
    });
    fetchAdminData();
  }, [forumId]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, modQueueRes, bannedRes, modsRes] = await Promise.all([
        api.get(`/api/v1/forums/${forumId}/admin/stats`).catch(() => ({ data: { data: null } })),
        api.get(`/api/v1/forums/${forumId}/modqueue`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/v1/forums/${forumId}/admin/banned`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/v1/forums/${forumId}/admin/moderators`).catch(() => ({ data: { data: [] } })),
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
  }, [forumId]);

  const handleApprove = async (item: ModerationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/api/v1/forums/${forumId}/modqueue/${item.id}/approve`);
      setModQueue((prev) => prev.filter((i) => i.id !== item.id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
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
          } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      Alert.alert('Error', 'Failed to ban user');
    }
  };

  const renderOverview = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="document-text-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_posts ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Posts</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_comments ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Comments</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="people-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_members ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="flag-outline" size={28} color={colors.warning} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.pending_reports}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Reports</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="trending-up-outline" size={28} color={colors.success} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.posts_today}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts Today</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="pulse-outline" size={28} color={colors.success} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.active_users_24h}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active (24h)</Text>
      </View>
    </View>
  );

  const renderModQueueItem = ({ item }: { item: ModerationItem }) => (
    <View style={[styles.modItem, { backgroundColor: colors.surface }]}>
      <View style={styles.modItemHeader}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: item.type === 'post' ? colors.primary : colors.secondary },
          ]}
        >
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
        <Text style={[styles.modItemDate, { color: colors.textSecondary }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.modItemContent, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.modItemMeta}>
        <Text style={[styles.modItemAuthor, { color: colors.textSecondary }]}>
          By u/{item.author?.username || 'unknown'}
        </Text>
        <Text style={[styles.modItemReason, { color: colors.warning }]}>Reason: {item.reason}</Text>
      </View>
      <View style={styles.modItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.success }]}
          onPress={() => handleApprove(item)}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => handleRemove(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBannedUser = ({ item }: { item: BannedUser }) => (
    <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: colors.text }]}>
            u/{item.user?.username || 'unknown'}
          </Text>
          <Text style={[styles.banReason, { color: colors.textSecondary }]}>{item.reason}</Text>
          <Text style={[styles.banDate, { color: colors.textSecondary }]}>
            Banned {new Date(item.banned_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.unbanButton, { borderColor: colors.success }]}
        onPress={() => handleUnban(item.user.id)}
      >
        <Text style={[styles.unbanButtonText, { color: colors.success }]}>Unban</Text>
      </TouchableOpacity>
    </View>
  );

  const renderModerator = ({ item }: { item: Moderator }) => (
    <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {item.user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: colors.text }]}>
            u/{item.user?.username || 'unknown'}
          </Text>
          <Text style={[styles.modPermissions, { color: colors.textSecondary }]}>
            {item.permissions?.join(', ') || 'Full permissions'}
          </Text>
        </View>
      </View>
      <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
    </View>
  );

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'modqueue', label: 'Mod Queue', icon: 'flag-outline' },
    { key: 'banned', label: 'Banned', icon: 'ban-outline' },
    { key: 'moderators', label: 'Mods', icon: 'shield-outline' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
          >
            <Ionicons
              name={tab.icon as unknown}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'overview' && (
        <FlatList
          data={[{ key: 'overview' }]}
          renderItem={() => renderOverview()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.content}
        />
      )}

      {activeTab === 'modqueue' && (
        <FlatList
          data={modQueue}
          renderItem={renderModQueueItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No items in mod queue
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'banned' && (
        <FlatList
          data={bannedUsers}
          renderItem={renderBannedUser}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No banned users
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'moderators' && (
        <FlatList
          data={moderators}
          renderItem={renderModerator}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No moderators yet
              </Text>
            </View>
          }
        />
      )}

      {/* Ban User Modal */}
      <Modal visible={showBanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ban User</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Banning u/{selectedUser?.username}
            </Text>
            <TextInput
              style={[styles.reasonInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Reason for ban"
              placeholderTextColor={colors.textSecondary}
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleBanUser}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Ban User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  modItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modItemDate: {
    fontSize: 12,
  },
  modItemContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  modItemMeta: {
    marginBottom: 12,
  },
  modItemAuthor: {
    fontSize: 12,
    marginBottom: 2,
  },
  modItemReason: {
    fontSize: 12,
  },
  modItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {},
  removeButton: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  banReason: {
    fontSize: 13,
    marginTop: 2,
  },
  banDate: {
    fontSize: 11,
    marginTop: 2,
  },
  modPermissions: {
    fontSize: 12,
    marginTop: 2,
  },
  unbanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unbanButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
