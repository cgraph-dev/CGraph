/**
 * GroupModerationScreen - Moderation tools (bans, mutes, audit log)
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
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/theme-context';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupModeration'>;
  route: RouteProp<GroupsStackParamList, 'GroupModeration'>;
};

type Tab = 'bans' | 'audit';

interface BannedUser {
  id: string;
  userId: string;
  username: string;
  reason: string | null;
  bannedAt: string;
  expiresAt: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actorUsername: string;
  targetUsername: string | null;
  details: string | null;
  createdAt: string;
}

const actionIcons: Record<string, string> = {
  member_banned: 'ban-outline',
  member_kicked: 'exit-outline',
  member_muted: 'volume-mute-outline',
  channel_created: 'add-circle-outline',
  channel_deleted: 'trash-outline',
  role_created: 'shield-outline',
  role_updated: 'create-outline',
  settings_updated: 'settings-outline',
};

export default function GroupModerationScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('bans');
  const [bans, setBans] = useState<BannedUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/bans`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setBans(
        data.map((b: Record<string, unknown>) => ({
          id: (b.id ?? b.user_id ?? '') as string,
          userId: (b.user_id ?? b.userId ?? '') as string,
          username: (b.username ?? (b.user as Record<string, unknown>)?.username ?? 'unknown') as string,
          reason: (b.reason ?? null) as string | null,
          bannedAt: (b.banned_at ?? b.bannedAt ?? b.inserted_at ?? '') as string,
          expiresAt: (b.expires_at ?? b.expiresAt ?? null) as string | null,
        }))
      );
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchAuditLog = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/audit-log`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setAuditLog(
        data.map((e: Record<string, unknown>) => ({
          id: (e.id ?? '') as string,
          action: (e.action ?? e.action_type ?? '') as string,
          actorUsername: (e.actor_username ?? e.actorUsername ?? (e.actor as Record<string, unknown>)?.username ?? 'unknown') as string,
          targetUsername: (e.target_username ?? e.targetUsername ?? (e.target as Record<string, unknown>)?.username ?? null) as string | null,
          details: (e.details ?? e.reason ?? null) as string | null,
          createdAt: (e.created_at ?? e.createdAt ?? e.inserted_at ?? '') as string,
        }))
      );
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (tab === 'bans') fetchBans();
    else fetchAuditLog();
  }, [tab, fetchBans, fetchAuditLog]);

  const handleUnban = (ban: BannedUser) => {
    Alert.alert('Unban User', `Unban ${ban.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unban',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/groups/${groupId}/bans/${ban.userId}`);
            setBans((prev) => prev.filter((b) => b.id !== ban.id));
          } catch {
            Alert.alert('Error', 'Failed to unban user');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderBan = ({ item, index }: { item: BannedUser; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 40)}
      exiting={FadeOutRight.duration(200)}
    >
      <View style={[styles.item, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.error + '20' }]}>
          <Ionicons name="ban-outline" size={20} color={colors.error} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.username}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Banned {formatDate(item.bannedAt)}
            {item.reason ? ` · ${item.reason}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unbanBtn, { borderColor: colors.primary }]}
          onPress={() => handleUnban(item)}
        >
          <Text style={[styles.unbanText, { color: colors.primary }]}>Unban</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderAudit = ({ item, index }: { item: AuditEntry; index: number }) => (
    <Animated.View entering={FadeInDown.springify().delay(index * 30)}>
      <View style={[styles.item, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.textTertiary + '20' }]}>
          <Ionicons
            name={(actionIcons[item.action] || 'document-text-outline') as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.auditText, { color: colors.text }]}>
            <Text style={{ fontWeight: '700' }}>{item.actorUsername}</Text>
            {' '}{item.action.replace(/_/g, ' ')}
            {item.targetUsername && (
              <Text style={{ fontWeight: '700' }}> {item.targetUsername}</Text>
            )}
          </Text>
          <Text style={[styles.meta, { color: colors.textTertiary }]}>
            {formatDate(item.createdAt)}
            {item.details ? ` · ${item.details}` : ''}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        {(['bans', 'audit'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>
              {t === 'bans' ? 'Bans' : 'Audit Log'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === 'bans' ? (
        <FlatList
          data={bans}
          keyExtractor={(item) => item.id}
          renderItem={renderBan}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No bans</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={auditLog}
          keyExtractor={(item) => item.id}
          renderItem={renderAudit}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No audit log entries</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12 },
  auditText: { fontSize: 14, lineHeight: 20 },
  unbanBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  unbanText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
