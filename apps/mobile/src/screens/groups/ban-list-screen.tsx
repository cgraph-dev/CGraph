/**
 * BanListScreen - View and manage active bans for a group
 * @module screens/groups
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeOutRight, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'BanList'>;
  route: RouteProp<GroupsStackParamList, 'BanList'>;
};

interface BannedUser {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  reason: string | null;
  bannedBy: string | null;
  bannedAt: string;
  expiresAt: string | null;
}

/**
 * Ban list management screen with active bans and unban capability.
 */
export default function BanListScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [bans, setBans] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBans = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        const res = await api.get(`/api/v1/groups/${groupId}/bans`);
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setBans(
          data.map((b: Record<string, unknown>) => ({
             
            id: (b.id ?? b.user_id ?? '') as string,
             
            userId: (b.user_id ?? b.userId ?? '') as string,
             
            username: (b.username ??
               
              (b.user as Record<string, unknown>)?.username ??
              'unknown') as string,
             
            avatarUrl: (b.avatar_url ?? (b.user as Record<string, unknown>)?.avatar_url ?? null) as
              | string
              | null,
             
            reason: (b.reason ?? null) as string | null,
             
            bannedBy: (b.banned_by_username ?? b.bannedBy ?? null) as string | null,
             
            bannedAt: (b.banned_at ?? b.bannedAt ?? b.inserted_at ?? '') as string,
             
            expiresAt: (b.expires_at ?? b.expiresAt ?? null) as string | null,
          }))
        );
      } catch {
        if (!isRefresh) Alert.alert('Error', 'Failed to load ban list');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupId]
  );

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleUnban = (ban: BannedUser) => {
    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${ban.username}? They will be able to rejoin the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/groups/${groupId}/bans/${ban.userId}`);
              setBans((prev) => prev.filter((b) => b.id !== ban.id));
            } catch {
              Alert.alert('Error', 'Failed to unban user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Permanent';
    const d = new Date(expiresAt);
    if (d.getTime() < Date.now()) return 'Expired';
    const diff = d.getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expiring soon';
  };

  const renderBan = ({ item, index }: { item: BannedUser; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 50)}
      exiting={FadeOutRight.duration(200)}
    >
      <View style={[styles.banCard, { backgroundColor: colors.surface }]}>
        <View style={styles.banHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="ban-outline" size={20} color={colors.error} />
          </View>
          <View style={styles.banInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
            <Text style={[styles.banMeta, { color: colors.textTertiary }]}>
              Banned {formatDate(item.bannedAt)}
              {item.bannedBy ? ` by ${item.bannedBy}` : ''}
            </Text>
          </View>
        </View>

        {item.reason && (
          <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{item.reason}</Text>
          </View>
        )}

        <View style={styles.banFooter}>
          <View
            style={[
              styles.expiryBadge,
              { backgroundColor: item.expiresAt ? colors.warning + '20' : colors.error + '15' },
            ]}
          >
            <Ionicons
              name={item.expiresAt ? 'time-outline' : 'infinite-outline'}
              size={14}
              color={item.expiresAt ? colors.warning : colors.error}
            />
            <Text
              style={[styles.expiryText, { color: item.expiresAt ? colors.warning : colors.error }]}
            >
              {formatExpiry(item.expiresAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.unbanButton, { borderColor: colors.primary }]}
            onPress={() => handleUnban(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.unbanText, { color: colors.primary }]}>Unban</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bans}
        keyExtractor={(item) => item.id}
        renderItem={renderBan}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchBans(true);
        }}
        ListEmptyComponent={
          <Animated.View entering={SlideInRight.springify()} style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Bans</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Banned members will appear here
            </Text>
          </Animated.View>
        }
        ListHeaderComponent={
          bans.length > 0 ? (
            <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
              {bans.length} active {bans.length === 1 ? 'ban' : 'bans'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  headerCount: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  banCard: { borderRadius: 14, padding: 16, gap: 12 },
  banHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banInfo: { flex: 1, gap: 2 },
  username: { fontSize: 15, fontWeight: '600' },
  banMeta: { fontSize: 12 },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  reasonText: { flex: 1, fontSize: 13, lineHeight: 18 },
  banFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  expiryText: { fontSize: 12, fontWeight: '500' },
  unbanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  unbanText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
});
