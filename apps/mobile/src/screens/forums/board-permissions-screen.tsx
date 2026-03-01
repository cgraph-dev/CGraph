/**
 * Board Permissions Screen (Mobile)
 *
 * Board picker (horizontal scroll), groups with expandable permissions,
 * inherit/allow/deny segmented control, "Apply Template" bottom sheet.
 *
 * @module screens/forums/board-permissions-screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────

type PermLevel = 'inherit' | 'allow' | 'deny';

interface BoardPerm {
  id: string;
  group_id: string;
  group_name: string;
  group_color: string | null;
  permissions: Record<string, PermLevel>;
}

interface PermTemplate {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

interface Board {
  id: string;
  name: string;
}

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'BoardPermissions'>;
  route: RouteProp<ForumsStackParamList, 'BoardPermissions'>;
};

const PERM_KEYS = [
  'can_view', 'can_view_threads', 'can_create_threads', 'can_reply',
  'can_edit_own_posts', 'can_delete_own_posts', 'can_upload_attachments',
  'can_create_polls', 'can_vote_polls', 'can_moderate', 'can_edit_posts',
  'can_delete_posts', 'can_move_threads', 'can_lock_threads', 'can_pin_threads',
];

const LEVEL_COLORS: Record<PermLevel, { bg: string; text: string }> = {
  inherit: { bg: '#374151', text: '#9ca3af' },
  allow: { bg: '#166534', text: '#4ade80' },
  deny: { bg: '#991b1b', text: '#f87171' },
};

// ── Screen ───────────────────────────────────────────────────────────────

export default function BoardPermissionsScreen({ route }: Props) {
  const { forumId, boardId, boardName } = route.params;
  const { colors } = useThemeStore();

  const [perms, setPerms] = useState<BoardPerm[]>([]);
  const [templates, setTemplates] = useState<PermTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPerms = useCallback(async () => {
    try {
      const [permsRes, templatesRes] = await Promise.all([
        api.get(`/api/v1/boards/${boardId}/permissions`),
        api.get(`/api/v1/forums/${forumId}/permission-templates`),
      ]);
      setPerms((permsRes.data?.permissions || []) as BoardPerm[]);
      setTemplates((templatesRes.data?.templates || []) as PermTemplate[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [boardId, forumId]);

  useEffect(() => { fetchPerms(); }, [fetchPerms]);

  const handleRefresh = () => { setRefreshing(true); fetchPerms(); };

  const handleTogglePerm = useCallback(async (groupId: string, key: string, current: PermLevel) => {
    const cycle: PermLevel[] = ['inherit', 'allow', 'deny'];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    const next = cycle[nextIdx];

    // Optimistic update
    setPerms((prev) =>
      prev.map((p) =>
        p.group_id === groupId
          ? { ...p, permissions: { ...p.permissions, [key]: next } }
          : p,
      ),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const perm = perms.find((p) => p.group_id === groupId);
      const updatedPerms = { ...perm?.permissions, [key]: next };
      await api.put(`/api/v1/boards/${boardId}/permissions`, {
        group_id: groupId,
        permissions: updatedPerms,
      });
    } catch {
      fetchPerms(); // revert
    }
  }, [boardId, perms, fetchPerms]);

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    setSaving(true);
    try {
      await api.post(`/api/v1/boards/${boardId}/permissions/apply-template`, {
        template_id: templateId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowTemplateModal(false);
      fetchPerms();
    } catch {
      Alert.alert('Error', 'Failed to apply template');
    } finally {
      setSaving(false);
    }
  }, [boardId, fetchPerms]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Board header */}
        <View style={styles.boardHeader}>
          <Text style={[styles.boardName, { color: colors.text }]}>
            {boardName || 'Board'} Permissions
          </Text>
          <TouchableOpacity
            onPress={() => setShowTemplateModal(true)}
            style={[styles.templateBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="document-text" size={16} color="#fff" />
            <Text style={styles.templateBtnText}>Apply Template</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {(['inherit', 'allow', 'deny'] as PermLevel[]).map((level) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLORS[level].bg }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* Group list with expandable permissions */}
        {perms.map((perm) => (
          <View key={perm.group_id} style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setExpandedGroupId(expandedGroupId === perm.group_id ? null : perm.group_id)}
              style={styles.groupRow}
            >
              <View style={styles.groupInfo}>
                <View style={[styles.colorDot, { backgroundColor: perm.group_color || '#6b7280' }]} />
                <Text style={[styles.groupName, { color: colors.text }]}>{perm.group_name}</Text>
              </View>
              <Ionicons
                name={expandedGroupId === perm.group_id ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {expandedGroupId === perm.group_id && (
              <View style={[styles.permsList, { borderTopColor: colors.border }]}>
                {PERM_KEYS.map((key) => {
                  const level = perm.permissions[key] || 'inherit';
                  return (
                    <View key={key} style={styles.permRow}>
                      <Text style={[styles.permLabel, { color: colors.text }]}>
                        {key.replace(/^can_/, '').replace(/_/g, ' ')}
                      </Text>
                      {/* Segmented control */}
                      <View style={styles.segmented}>
                        {(['inherit', 'allow', 'deny'] as PermLevel[]).map((l) => (
                          <TouchableOpacity
                            key={l}
                            onPress={() => handleTogglePerm(perm.group_id, key, level)}
                            style={[
                              styles.segBtn,
                              level === l && { backgroundColor: LEVEL_COLORS[l].bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.segText,
                                { color: level === l ? LEVEL_COLORS[l].text : colors.textSecondary },
                              ]}
                            >
                              {l === 'inherit' ? '—' : l === 'allow' ? '✓' : '✗'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {perms.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No permission overrides set
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Template Bottom Sheet */}
      <Modal visible={showTemplateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Apply Permission Template</Text>
            <FlatList
              data={templates}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleApplyTemplate(item.id)}
                  style={[styles.tmplItem, { borderColor: colors.border }]}
                  disabled={saving}
                >
                  <View>
                    <View style={styles.tmplNameRow}>
                      <Text style={[styles.tmplName, { color: colors.text }]}>{item.name}</Text>
                      {item.is_system && (
                        <View style={[styles.badge, { backgroundColor: '#1e3a5f' }]}>
                          <Text style={styles.badgeText}>System</Text>
                        </View>
                      )}
                    </View>
                    {item.description && (
                      <Text style={[styles.tmplDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textSecondary, padding: 16 }]}>No templates available</Text>
              }
            />
            <TouchableOpacity onPress={() => setShowTemplateModal(false)} style={styles.cancelBtn}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
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
  boardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  boardName: { fontSize: 18, fontWeight: '700', flex: 1 },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  templateBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  groupCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  groupName: { fontSize: 15, fontWeight: '600' },
  permsList: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  permLabel: { fontSize: 13, textTransform: 'capitalize', flex: 1 },
  segmented: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', gap: 2 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1f2937' },
  segText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  tmplItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  tmplNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tmplName: { fontSize: 15, fontWeight: '600' },
  tmplDesc: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#93c5fd', fontSize: 10, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
});
