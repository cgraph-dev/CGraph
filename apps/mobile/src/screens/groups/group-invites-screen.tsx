/**
 * GroupInvitesScreen - Manage group invite links
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
  Share,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupInvites'>;
  route: RouteProp<GroupsStackParamList, 'GroupInvites'>;
};

interface Invite {
  id: string;
  code: string;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

/**
 *
 */
export default function GroupInvitesScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/invites`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setInvites(
        data.map((i: Record<string, unknown>) => ({
           
          id: (i.id ?? '') as string,
           
          code: (i.code ?? '') as string,
           
          uses: (i.uses ?? 0) as number,
           
          maxUses: (i.max_uses ?? i.maxUses ?? null) as number | null,
           
          expiresAt: (i.expires_at ?? i.expiresAt ?? null) as string | null,
           
          createdBy: (i.created_by ?? i.createdBy ?? '') as string,
           
          createdAt: (i.inserted_at ?? i.createdAt ?? '') as string,
        }))
      );
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await api.post(`/api/v1/groups/${groupId}/invites`, {
        max_uses: null,
        max_age: 86400 * 7, // 7 days
      });
      const invite = res.data?.data ?? res.data;
      if (invite?.code) {
        const link = `https://cgraph.app/invite/${invite.code}`;
        Share.share({ message: `Join my group on CGraph! ${link}`, url: link });
      }
      fetchInvites();
    } catch {
      Alert.alert('Error', 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = (code: string) => {
    const link = `https://cgraph.app/invite/${code}`;
    Share.share({ message: `Join my group on CGraph! ${link}`, url: link });
  };

  const handleDelete = (invite: Invite) => {
    Alert.alert('Delete Invite', `Delete invite ${invite.code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/groups/${groupId}/invites/${invite.id}`);
            setInvites((prev) => prev.filter((i) => i.id !== invite.id));
          } catch {
            Alert.alert('Error', 'Failed to delete invite');
          }
        },
      },
    ]);
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    if (date < new Date()) return 'Expired';
    const hours = Math.round((date.getTime() - Date.now()) / 3600000);
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.round(hours / 24)}d remaining`;
  };

  const renderInvite = ({ item, index }: { item: Invite; index: number }) => (
    <Animated.View entering={FadeInDown.springify().delay(index * 40)} exiting={FadeOutLeft.duration(200)}>
      <View style={[styles.inviteItem, { backgroundColor: colors.surface }]}>
        <View style={styles.inviteInfo}>
          <View style={styles.codeRow}>
            <Ionicons name="link" size={16} color={colors.primary} />
            <Text style={[styles.codeText, { color: colors.text }]}>{item.code}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {item.uses}{item.maxUses ? `/${item.maxUses}` : ''} uses · {formatExpiry(item.expiresAt)}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item.code)}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Create Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Create Invite Link</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInvite}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="link-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No invite links yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Create one to invite friends
              </Text>
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
  headerRow: { paddingHorizontal: 16, paddingVertical: 12 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  inviteInfo: { flex: 1, gap: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeText: { fontSize: 15, fontWeight: '600', fontFamily: 'monospace' },
  metaText: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '500' },
  emptySubtext: { fontSize: 13 },
});
