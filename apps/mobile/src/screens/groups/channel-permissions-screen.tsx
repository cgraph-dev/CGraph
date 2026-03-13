/**
 * ChannelPermissionsScreen - Per-channel role/member permission overrides
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
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore, type ThemeColors } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'ChannelPermissions'>;
  route: RouteProp<GroupsStackParamList, 'ChannelPermissions'>;
};

interface Role {
  id: string;
  name: string;
  color: string | null;
  position: number;
}

interface PermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  role_id: string | null;
  member_id: string | null;
  allow: number;
  deny: number;
  role?: Role;
}

// ============================================================================
// Permission Definitions
// ============================================================================

const PERMISSION_BITS: Record<string, number> = {
  view_channels: 1 << 0,
  send_messages: 1 << 1,
  send_files: 1 << 2,
  embed_links: 1 << 3,
  add_reactions: 1 << 4,
  use_external_emojis: 1 << 5,
  mention_everyone: 1 << 6,
  manage_messages: 1 << 7,
  read_message_history: 1 << 8,
  connect_voice: 1 << 9,
  speak_voice: 1 << 10,
  mute_members: 1 << 11,
  deafen_members: 1 << 12,
  move_members: 1 << 13,
  manage_channels: 1 << 14,
  manage_roles: 1 << 15,
  manage_group: 1 << 16,
  kick_members: 1 << 17,
  ban_members: 1 << 18,
  create_invites: 1 << 19,
  change_nickname: 1 << 20,
  manage_nicknames: 1 << 21,
  manage_emojis: 1 << 22,
  manage_automod: 1 << 23,
  administrator: (1 << 31) >>> 0,
};

interface PermissionInfo {
  key: string;
  label: string;
}

const ALL_PERMISSIONS: PermissionInfo[] = [
  { key: 'view_channels', label: 'View Channels' },
  { key: 'send_messages', label: 'Send Messages' },
  { key: 'send_files', label: 'Send Files' },
  { key: 'embed_links', label: 'Embed Links' },
  { key: 'add_reactions', label: 'Add Reactions' },
  { key: 'use_external_emojis', label: 'External Emojis' },
  { key: 'mention_everyone', label: 'Mention Everyone' },
  { key: 'manage_messages', label: 'Manage Messages' },
  { key: 'read_message_history', label: 'Read History' },
  { key: 'connect_voice', label: 'Connect Voice' },
  { key: 'speak_voice', label: 'Speak Voice' },
  { key: 'mute_members', label: 'Mute Members' },
  { key: 'deafen_members', label: 'Deafen Members' },
  { key: 'move_members', label: 'Move Members' },
  { key: 'manage_channels', label: 'Manage Channels' },
  { key: 'manage_roles', label: 'Manage Roles' },
  { key: 'manage_group', label: 'Manage Group' },
  { key: 'kick_members', label: 'Kick Members' },
  { key: 'ban_members', label: 'Ban Members' },
  { key: 'create_invites', label: 'Create Invites' },
  { key: 'change_nickname', label: 'Change Nickname' },
  { key: 'manage_nicknames', label: 'Manage Nicknames' },
  { key: 'manage_emojis', label: 'Manage Emojis' },
  { key: 'manage_automod', label: 'Manage Automod' },
];

type PermState = 'inherit' | 'allow' | 'deny';

function getPermState(allow: number, deny: number, bit: number): PermState {
  if (allow & bit) return 'allow';
  if (deny & bit) return 'deny';
  return 'inherit';
}

function setPermState(
  allow: number,
  deny: number,
  bit: number,
  state: PermState
): { allow: number; deny: number } {
  // Clear bit from both
  let newAllow = allow & ~bit;
  let newDeny = deny & ~bit;
  if (state === 'allow') newAllow |= bit;
  if (state === 'deny') newDeny |= bit;
  return { allow: newAllow, deny: newDeny };
}

// ============================================================================
// Segmented Control for 3-state permission
// ============================================================================

function PermissionSegmentedControl({
  state,
  onChange,
  colors,
}: {
  state: PermState;
  onChange: (s: PermState) => void;
  colors: ThemeColors;
}) {
  const options: { value: PermState; label: string; activeColor: string }[] = [
    { value: 'deny', label: '✗', activeColor: '#E74C3C' },
    { value: 'inherit', label: '—', activeColor: colors.textSecondary },
    { value: 'allow', label: '✓', activeColor: '#2ECC71' },
  ];

  return (
    <View style={[segStyles.container, { borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = state === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[segStyles.segment, active && { backgroundColor: opt.activeColor }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[segStyles.segLabel, active && segStyles.segLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
  },
  segLabelActive: {
    color: '#fff',
  },
});

// ============================================================================
// Main Screen
// ============================================================================

/**
 * Channel Permissions Screen component.
 *
 */
export default function ChannelPermissionsScreen({ _navigation, route }: Props) {
  const { channelId, groupId } = route.params;
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [overwrites, setOverwrites] = useState<PermissionOverwrite[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Editing state
  const [editingOverwrite, setEditingOverwrite] = useState<PermissionOverwrite | null>(null);
  const [editAllow, setEditAllow] = useState(0);
  const [editDeny, setEditDeny] = useState(0);
  const [saving, setSaving] = useState(false);

  // Add override: role picker
  const [showRolePicker, setShowRolePicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [owRes, rolesRes] = await Promise.all([
        api.get(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`),
        api.get(`/api/v1/groups/${groupId}/roles`),
      ]);
      const owData = Array.isArray(owRes.data?.data)
        ? owRes.data.data
        : Array.isArray(owRes.data)
          ? owRes.data
          : [];
      const rolesData = Array.isArray(rolesRes.data?.data)
        ? rolesRes.data.data
        : Array.isArray(rolesRes.data)
          ? rolesRes.data
          : [];
      setOverwrites(owData);
      setRoles(rolesData.sort((a: Role, b: Role) => b.position - a.position));
    } catch {
      Alert.alert('Error', 'Failed to load channel permissions');
    } finally {
      setLoading(false);
    }
  }, [groupId, channelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleEditOverwrite = (ow: PermissionOverwrite) => {
    setEditingOverwrite(ow);
    setEditAllow(ow.allow);
    setEditDeny(ow.deny);
  };

  const handlePermChange = (permKey: string, newState: PermState) => {
    const bit = PERMISSION_BITS[permKey];
    if (bit === undefined) return;
    const result = setPermState(editAllow, editDeny, bit, newState);
    setEditAllow(result.allow);
    setEditDeny(result.deny);
  };

  const handleSaveOverwrite = async () => {
    if (!editingOverwrite) return;
    setSaving(true);
    try {
      await api.patch(
        `/api/v1/groups/${groupId}/channels/${channelId}/permissions/${editingOverwrite.id}`,
        { allow: editAllow, deny: editDeny }
      );
      setEditingOverwrite(null);
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverwrite = (ow: PermissionOverwrite) => {
    const roleName = roles.find((r) => r.id === ow.role_id)?.name ?? 'this override';
    Alert.alert('Delete Override', `Remove permission override for ${roleName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(
              `/api/v1/groups/${groupId}/channels/${channelId}/permissions/${ow.id}`
            );
            fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete override');
          }
        },
      },
    ]);
  };

  const handleAddOverride = async (role: Role) => {
    setShowRolePicker(false);
    try {
      const res = await api.post(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`, {
        type: 'role',
        role_id: role.id,
        allow: 0,
        deny: 0,
      });
      const newOw = res.data?.data ?? res.data;
      fetchData();
      if (newOw?.id) {
        handleEditOverwrite({ ...newOw, allow: 0, deny: 0 });
      }
    } catch {
      Alert.alert('Error', 'Failed to create override');
    }
  };

  // ============================================================================
  // Render: Permission Editor for an override
  // ============================================================================

  if (editingOverwrite) {
    const roleName =
      roles.find((r) => r.id === editingOverwrite.role_id)?.name || 'Member Override';
    const hasChanges = editAllow !== editingOverwrite.allow || editDeny !== editingOverwrite.deny;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => setEditingOverwrite(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{roleName}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.permListContent}>
          {ALL_PERMISSIONS.map((perm) => {
            const bit = PERMISSION_BITS[perm.key];
            const state = getPermState(editAllow, editDeny, bit);

            return (
              <View key={perm.key} style={[styles.permRow, { backgroundColor: colors.surface }]}>
                <Text style={[styles.permLabel, { color: colors.text, flex: 1 }]}>
                  {perm.label}
                </Text>
                <PermissionSegmentedControl
                  state={state}
                  onChange={(s) => handlePermChange(perm.key, s)}
                  colors={colors}
                />
              </View>
            );
          })}

          {hasChanges && (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveOverwrite}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ============================================================================
  // Render: Role Picker
  // ============================================================================

  if (showRolePicker) {
    const existingRoleIds = new Set(
      overwrites.filter((o) => o.type === 'role').map((o) => o.role_id)
    );
    const availableRoles = roles.filter((r) => !existingRoleIds.has(r.id));

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => setShowRolePicker(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Select Role</Text>
        </View>

        <FlatList
          data={availableRoles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.rolePickerList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.rolePickerItem, { backgroundColor: colors.surface }]}
              onPress={() => handleAddOverride(item)}
            >
              <View
                style={[
                  styles.roleColorDot,
                  { backgroundColor: item.color || colors.textSecondary },
                ]}
              />
              <Text style={[styles.rolePickerName, { color: colors.text }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                All roles already have overrides
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // ============================================================================
  // Render: Overrides List
  // ============================================================================

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const summarizeOverwrite = (ow: PermissionOverwrite): string => {
    const allowCount = ALL_PERMISSIONS.filter(
      (p) => (ow.allow & PERMISSION_BITS[p.key]) !== 0
    ).length;
    const denyCount = ALL_PERMISSIONS.filter(
      (p) => (ow.deny & PERMISSION_BITS[p.key]) !== 0
    ).length;
    const parts: string[] = [];
    if (allowCount > 0) parts.push(`${allowCount} allowed`);
    if (denyCount > 0) parts.push(`${denyCount} denied`);
    return parts.length > 0 ? parts.join(', ') : 'No overrides set';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={overwrites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const roleName = roles.find((r) => r.id === item.role_id)?.name || 'Unknown';
          const roleColor = roles.find((r) => r.id === item.role_id)?.color || colors.textSecondary;

          return (
            <Animated.View entering={FadeInDown.springify().delay(index * 40)}>
              <TouchableOpacity
                style={[styles.overwriteItem, { backgroundColor: colors.surface }]}
                onPress={() => handleEditOverwrite(item)}
                onLongPress={() => handleDeleteOverwrite(item)}
              >
                <View style={[styles.roleColorDot, { backgroundColor: roleColor }]} />
                <View style={styles.overwriteInfo}>
                  <Text style={[styles.overwriteName, { color: colors.text }]}>
                    {item.type === 'role' ? roleName : 'Member Override'}
                  </Text>
                  <Text style={[styles.overwriteSummary, { color: colors.textSecondary }]}>
                    {summarizeOverwrite(item)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-open-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No permission overrides
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
              Add overrides to customize permissions for specific roles in this channel
            </Text>
          </View>
        }
      />

      {/* FAB: Add Override */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowRolePicker(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },

  listContent: { padding: 16, paddingBottom: 80 },

  // Override list item
  overwriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleColorDot: { width: 14, height: 14, borderRadius: 7 },
  overwriteInfo: { flex: 1, marginLeft: 12 },
  overwriteName: { fontSize: 16, fontWeight: '600' },
  overwriteSummary: { fontSize: 12, marginTop: 2 },

  // Permission editor
  permListContent: { padding: 16, paddingBottom: 100 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  permLabel: { fontSize: 15, fontWeight: '600' },
  saveButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Role picker
  rolePickerList: { padding: 16 },
  rolePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  rolePickerName: { fontSize: 16, fontWeight: '600' },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
