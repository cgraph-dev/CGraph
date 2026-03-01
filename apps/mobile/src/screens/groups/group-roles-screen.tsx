/**
 * GroupRolesScreen - Full role editor with permission toggles
 * @module screens/groups
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupRoles'>;
  route: RouteProp<GroupsStackParamList, 'GroupRoles'>;
};

interface Role {
  id: string;
  name: string;
  color: string | null;
  position: number;
  permissions: number;
  is_default: boolean;
  memberCount?: number;
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
  administrator: 1 << 31 >>> 0, // unsigned shift for bit 31
};

interface PermissionDef {
  key: string;
  label: string;
  description: string;
}

const PERMISSION_CATEGORIES: { title: string; data: PermissionDef[] }[] = [
  {
    title: 'General',
    data: [
      { key: 'view_channels', label: 'View Channels', description: 'Allows viewing text and voice channels' },
      { key: 'manage_channels', label: 'Manage Channels', description: 'Create, edit, and delete channels' },
      { key: 'manage_group', label: 'Manage Group', description: 'Edit group name, icon, and settings' },
      { key: 'administrator', label: 'Administrator', description: 'Full access — bypasses all permission checks' },
    ],
  },
  {
    title: 'Membership',
    data: [
      { key: 'kick_members', label: 'Kick Members', description: 'Remove members from the group' },
      { key: 'ban_members', label: 'Ban Members', description: 'Permanently ban members' },
      { key: 'create_invites', label: 'Create Invites', description: 'Create invite links' },
      { key: 'change_nickname', label: 'Change Nickname', description: 'Change own nickname' },
      { key: 'manage_nicknames', label: 'Manage Nicknames', description: "Change other members' nicknames" },
    ],
  },
  {
    title: 'Text',
    data: [
      { key: 'send_messages', label: 'Send Messages', description: 'Send messages in text channels' },
      { key: 'send_files', label: 'Send Files', description: 'Upload files and images' },
      { key: 'embed_links', label: 'Embed Links', description: 'Links will show previews' },
      { key: 'manage_messages', label: 'Manage Messages', description: 'Delete or pin messages by others' },
      { key: 'read_message_history', label: 'Read Message History', description: 'View older messages' },
    ],
  },
  {
    title: 'Voice',
    data: [
      { key: 'connect_voice', label: 'Connect', description: 'Join voice channels' },
      { key: 'speak_voice', label: 'Speak', description: 'Speak in voice channels' },
      { key: 'mute_members', label: 'Mute Members', description: 'Mute other members in voice' },
      { key: 'deafen_members', label: 'Deafen Members', description: 'Deafen other members in voice' },
      { key: 'move_members', label: 'Move Members', description: 'Move members between voice channels' },
    ],
  },
  {
    title: 'Advanced',
    data: [
      { key: 'add_reactions', label: 'Add Reactions', description: 'React to messages' },
      { key: 'use_external_emojis', label: 'Use External Emojis', description: 'Use emojis from other groups' },
      { key: 'mention_everyone', label: 'Mention Everyone', description: 'Use @everyone and @here' },
      { key: 'manage_emojis', label: 'Manage Emojis', description: 'Add and remove custom emojis' },
      { key: 'manage_roles', label: 'Manage Roles', description: 'Create and edit roles' },
      { key: 'manage_automod', label: 'Manage Automod', description: 'Configure automatic moderation rules' },
    ],
  },
];

// ============================================================================
// Bitmask Utilities
// ============================================================================

function hasPermission(bitmask: number, bit: number): boolean {
  return (bitmask & bit) !== 0;
}

function togglePermission(bitmask: number, bit: number): number {
  return hasPermission(bitmask, bit) ? bitmask & ~bit : bitmask | bit;
}

// ============================================================================
// Color Picker
// ============================================================================

const PRESET_COLORS = [
  '#99AAB5', '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6',
  '#E91E63', '#F1C40F', '#E67E22', '#E74C3C', '#11806A',
  '#1F8B4C', '#206694', '#71368A', '#AD1457', '#C27C0E',
  '#A84300', '#992D22', '#FFFFFF',
];

// ============================================================================
// Main Screen Component
// ============================================================================

/**
 *
 */
export default function GroupRolesScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editedPermissions, setEditedPermissions] = useState(0);
  const [saving, setSaving] = useState(false);

  // Create role state
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#99AAB5');

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/roles`);
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setRoles(data.sort((a: Role, b: Role) => b.position - a.position));
    } catch {
      Alert.alert('Error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ============================================================================
  // Role CRUD
  // ============================================================================

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setEditedPermissions(role.permissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.put(`/api/v1/groups/${groupId}/roles/${selectedRole.id}`, {
        permissions: editedPermissions,
      });
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? { ...r, permissions: editedPermissions } : r)),
      );
      setSelectedRole((prev) => (prev ? { ...prev, permissions: editedPermissions } : null));
      Alert.alert('Saved', 'Permissions updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      Alert.alert('Error', 'Role name is required');
      return;
    }
    try {
      await api.post(`/api/v1/groups/${groupId}/roles`, {
        name: newRoleName.trim(),
        color: newRoleColor,
      });
      setNewRoleName('');
      setNewRoleColor('#99AAB5');
      setShowCreate(false);
      fetchRoles();
    } catch {
      Alert.alert('Error', 'Failed to create role');
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.is_default) {
      Alert.alert('Error', 'Cannot delete the default role');
      return;
    }
    Alert.alert('Delete Role', `Are you sure you want to delete "${role.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/groups/${groupId}/roles/${role.id}`);
            if (selectedRole?.id === role.id) setSelectedRole(null);
            fetchRoles();
          } catch {
            Alert.alert('Error', 'Failed to delete role');
          }
        },
      },
    ]);
  };

  const handleTogglePermission = (permKey: string) => {
    const bit = PERMISSION_BITS[permKey];
    if (bit !== undefined) {
      setEditedPermissions((prev) => togglePermission(prev, bit));
    }
  };

  // ============================================================================
  // Render: Permission Editor
  // ============================================================================

  if (selectedRole) {
    const hasUnsavedChanges = editedPermissions !== selectedRole.permissions;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.editorHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.roleColorDot, { backgroundColor: selectedRole.color || colors.textSecondary }]} />
          <Text style={[styles.editorTitle, { color: colors.text }]}>{selectedRole.name}</Text>
          {!selectedRole.is_default && (
            <TouchableOpacity onPress={() => handleDeleteRole(selectedRole)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#E74C3C" />
            </TouchableOpacity>
          )}
        </View>

        <SectionList
          sections={PERMISSION_CATEGORIES}
          keyExtractor={(item) => item.key}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const bit = PERMISSION_BITS[item.key];
            const enabled = bit !== undefined && hasPermission(editedPermissions, bit);

            return (
              <View style={[styles.permRow, { backgroundColor: colors.surface }]}>
                <View style={styles.permInfo}>
                  <Text style={[styles.permLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.permDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => handleTogglePermission(item.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={enabled ? '#fff' : '#f4f3f4'}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.sectionListContent}
          stickySectionHeadersEnabled={false}
          ListFooterComponent={
            hasUnsavedChanges ? (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSavePermissions}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    );
  }

  // ============================================================================
  // Render: Create Role Modal
  // ============================================================================

  if (showCreate) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.createContainer}>
          <Text style={[styles.createTitle, { color: colors.text }]}>Create Role</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={newRoleName}
            onChangeText={setNewRoleName}
            placeholder="Role name"
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Color</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c, borderColor: newRoleColor === c ? colors.primary : 'transparent' },
                ]}
                onPress={() => setNewRoleColor(c)}
              />
            ))}
          </View>

          <View style={styles.createActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowCreate(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateRole}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ============================================================================
  // Render: Role List
  // ============================================================================

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
        data={roles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.springify().delay(index * 40)}
            exiting={FadeOutLeft.duration(200)}
          >
            <TouchableOpacity
              style={[styles.roleItem, { backgroundColor: colors.surface }]}
              onPress={() => handleSelectRole(item)}
              onLongPress={() => handleDeleteRole(item)}
            >
              <View style={[styles.roleColor, { backgroundColor: item.color || colors.textSecondary }]} />
              <View style={styles.roleInfo}>
                <Text style={[styles.roleName, { color: item.color || colors.text }]}>{item.name}</Text>
                {item.memberCount !== undefined && (
                  <Text style={[styles.roleMeta, { color: colors.textSecondary }]}>
                    {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No custom roles yet</Text>
          </View>
        }
      />

      {/* FAB: Create Role */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreate(true)}
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
  list: { padding: 16, gap: 8, paddingBottom: 80 },

  // Role list
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleColor: { width: 12, height: 12, borderRadius: 6 },
  roleInfo: { flex: 1, marginLeft: 12 },
  roleName: { fontSize: 16, fontWeight: '600' },
  roleMeta: { fontSize: 12, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },

  // Permission editor
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  roleColorDot: { width: 16, height: 16, borderRadius: 8 },
  editorTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  deleteBtn: { padding: 8 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionListContent: { paddingBottom: 100 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  permInfo: { flex: 1, marginRight: 12 },
  permLabel: { fontSize: 15, fontWeight: '600' },
  permDesc: { fontSize: 12, marginTop: 2 },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Create role
  createContainer: { padding: 24 },
  createTitle: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  createActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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
