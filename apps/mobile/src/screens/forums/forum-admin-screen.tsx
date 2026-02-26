/**
 * Forum administration screen for managing forum settings and moderation.
 * @module screens/forums/forum-admin-screen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { ForumsStackParamList } from '../../types';
import type { ModerationItem, BannedUser, Moderator, AdminTab } from './forum-admin-screen/types';
import { styles } from './forum-admin-screen/styles';
import { useForumAdmin } from './forum-admin-screen/use-forum-admin';
import { OverviewGrid, ModQueueItem, BannedUserItem, ModeratorItem } from './forum-admin-screen/components/admin-tab-views';
import { BanUserModal } from './forum-admin-screen/components/ban-user-modal';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumAdmin'>;
  route: RouteProp<ForumsStackParamList, 'ForumAdmin'>;
};

/**
 *
 */
export default function ForumAdminScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const admin = useForumAdmin(forumId);

  useEffect(() => {
    navigation.setOptions({ title: 'Admin Dashboard' });
    admin.fetchAdminData();
  }, [forumId]);

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'modqueue', label: 'Mod Queue', icon: 'flag-outline' },
    { key: 'banned', label: 'Banned', icon: 'ban-outline' },
    { key: 'moderators', label: 'Mods', icon: 'shield-outline' },
  ];

  if (admin.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
          >
            <Ionicons name={tab.icon as string} size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'overview' && (
        <FlatList
          data={[{ key: 'overview' }]}
          renderItem={() => <OverviewGrid stats={admin.stats} colors={colors} />}
          refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.content}
        />
      )}

      {activeTab === 'modqueue' && (
        <FlatList
          data={admin.modQueue}
          renderItem={({ item }) => <ModQueueItem item={item} colors={colors} onApprove={admin.handleApprove} onRemove={admin.handleRemove} />}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items in mod queue</Text>
            </View>
          }
        />
      )}

      {activeTab === 'banned' && (
        <FlatList
          data={admin.bannedUsers}
          renderItem={({ item }) => <BannedUserItem item={item} colors={colors} onUnban={admin.handleUnban} />}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No banned users</Text>
            </View>
          }
        />
      )}

      {activeTab === 'moderators' && (
        <FlatList
          data={admin.moderators}
          renderItem={({ item }) => <ModeratorItem item={item} colors={colors} />}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={admin.refreshing} onRefresh={admin.onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No moderators yet</Text>
            </View>
          }
        />
      )}

      {/* Ban modal */}
      <BanUserModal
        visible={admin.showBanModal}
        selectedUser={admin.selectedUser}
        banReason={admin.banReason}
        onBanReasonChange={admin.setBanReason}
        onConfirm={admin.handleBanUser}
        onCancel={() => { admin.setShowBanModal(false); admin.setBanReason(''); admin.setSelectedUser(null); }}
        colors={colors}
      />
    </View>
  );
}
