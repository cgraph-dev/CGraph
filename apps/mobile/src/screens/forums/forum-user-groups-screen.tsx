/**
 * Forum User Groups Screen (Mobile)
 *
 * List groups with badges, tap to view, long-press reorder,
 * edit permissions as toggles, secondary group assignment.
 *
 * Cross-plan note: Registered in forums-navigator.tsx and types/index.ts.
 *
 * @module screens/forums/forum-user-groups-screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  type: 'system' | 'custom' | 'joinable';
  position: number;
  is_default: boolean;
  is_staff: boolean;
  is_super_mod: boolean;
  member_count: number;
  permissions: Record<string, boolean | number>;
}

interface _SecondaryMember {
  id: string;
  user_id: string;
  username?: string;
  group_id: string;
  expires_at: string | null;
}

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumUserGroups'>;
  route: RouteProp<ForumsStackParamList, 'ForumUserGroups'>;
};

const PERMISSION_KEYS = [
  'can_view_forum',
  'can_post_threads',
  'can_post_replies',
  'can_edit_own_posts',
  'can_delete_own_posts',
  'can_upload_attachments',
  'can_create_polls',
  'can_moderate',
  'can_edit_posts',
  'can_delete_posts',
  'can_lock_threads',
  'can_warn_users',
  'can_ban_users',
  'can_manage_boards',
  'can_manage_settings',
];

// ── Screen ───────────────────────────────────────────────────────────────

/** Forum User Groups Screen component. */
export default function ForumUserGroupsScreen({ route }: Props) {
  const { forumId } = route.params;
  const { colors } = useThemeStore();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignGroupId, setAssignGroupId] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/forums/${forumId}/user-groups`);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = (res.data?.user_groups || []) as UserGroup[];
      setGroups(data.sort((a: UserGroup, b: UserGroup) => a.position - b.position));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleTogglePermission = useCallback(
    async (group: UserGroup, key: string) => {
      const newPerms = { ...group.permissions, [key]: !group.permissions[key] };
      try {
        await api.put(`/api/v1/forums/${forumId}/user-groups/${group.id}`, {
          user_group: { permissions: newPerms },
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, permissions: newPerms } : g))
        );
        if (selectedGroup?.id === group.id) {
          setSelectedGroup({ ...group, permissions: newPerms });
        }
      } catch {
        Alert.alert('Error', 'Failed to update permission');
      }
    },
    [forumId, selectedGroup]
  );

  const handleAssign = useCallback(async () => {
    if (!assignUserId.trim() || !assignGroupId) return;
    try {
      await api.post(`/api/v1/forums/${forumId}/secondary-groups`, {
        membership: { userId: assignUserId.trim(), groupId: assignGroupId },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAssignModal(false);
      setAssignUserId('');
      Alert.alert('Success', 'User assigned to secondary group');
    } catch {
      Alert.alert('Error', 'Failed to assign secondary group');
    }
  }, [forumId, assignUserId, assignGroupId]);

  const handleReorder = useCallback(
    async (group: UserGroup, direction: 'up' | 'down') => {
      const idx = groups.findIndex((g) => g.id === group.id);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === groups.length - 1))
        return;
      const newGroups = [...groups];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newGroups[idx], newGroups[swapIdx]] = [newGroups[swapIdx], newGroups[idx]];
      setGroups(newGroups);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await api.put(`/api/v1/forums/${forumId}/user-groups/reorder`, {
          group_ids: newGroups.map((g) => g.id),
        });
      } catch {
        fetchGroups(); // revert
      }
    },
    [forumId, groups, fetchGroups]
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header actions */}
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            User Groups ({groups.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              setAssignGroupId(groups[0]?.id || '');
              setShowAssignModal(true);
            }}
            style={[styles.smallButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.smallButtonText}>Assign</Text>
          </TouchableOpacity>
        </View>

        {/* Group list */}
        {groups.map((group, idx) => (
          <TouchableOpacity
            key={group.id}
            onPress={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
            onLongPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            style={[
              styles.groupCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.groupHeader}>
              <View style={styles.groupInfo}>
                <View style={[styles.colorDot, { backgroundColor: group.color || '#6b7280' }]} />
                <View>
                  <View style={styles.nameRow}>
                    <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                    {group.is_default && (
                      <View style={[styles.badge, { backgroundColor: '#1e3a5f' }]}>
                        <Text style={styles.badgeText}>Default</Text>
                      </View>
                    )}
                    {group.is_staff && (
                      <Ionicons name="shield-checkmark" size={14} color="#eab308" />
                    )}
                    {group.is_super_mod && <Ionicons name="star" size={14} color="#a855f7" />}
                  </View>
                  <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                    {group.member_count} members · {group.type}
                  </Text>
                </View>
              </View>
              <View style={styles.reorderButtons}>
                <TouchableOpacity onPress={() => handleReorder(group, 'up')} disabled={idx === 0}>
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={idx === 0 ? colors.border : colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReorder(group, 'down')}
                  disabled={idx === groups.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={idx === groups.length - 1 ? colors.border : colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expanded: toggle permissions */}
            {selectedGroup?.id === group.id && (
              <View style={[styles.permissionsSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.permTitle, { color: colors.textSecondary }]}>Permissions</Text>
                {PERMISSION_KEYS.map((key) => (
                  <View key={key} style={styles.permRow}>
                    <Text style={[styles.permLabel, { color: colors.text }]}>
                      {key.replace(/^can_/, '').replace(/_/g, ' ')}
                    </Text>
                    <Switch
                      value={!!group.permissions[key]}
                      onValueChange={() => handleTogglePermission(group, key)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {groups.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No user groups</Text>
          </View>
        )}
      </ScrollView>

      {/* Assign Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Secondary Group</Text>
            <TextInput
              value={assignUserId}
              onChangeText={setAssignUserId}
              placeholder="User ID or username"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.cancelBtn}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAssign}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#93c5fd', fontSize: 10, fontWeight: '600' },
  memberCount: { fontSize: 12, marginTop: 2 },
  reorderButtons: { gap: 2 },
  permissionsSection: { borderTopWidth: 1, padding: 14 },
  permTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  permLabel: { fontSize: 13, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  confirmBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
