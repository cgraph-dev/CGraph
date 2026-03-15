/**
 * AutomodSettingsScreen - Manage automod rules for a group
 * @module screens/groups
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import { api } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'AutomodSettings'>;
  route: RouteProp<GroupsStackParamList, 'AutomodSettings'>;
};

interface AutomodRule {
  id: string;
  name: string;
  ruleType: string;
  pattern: string;
  action: string;
  isEnabled: boolean;
}

const RULE_TYPE_ICONS: Record<string, string> = {
  word_filter: 'shield-outline',
  link_filter: 'link-outline',
  spam_detection: 'flash-outline',
  caps_filter: 'text-outline',
};

const RULE_TYPE_LABELS: Record<string, string> = {
  word_filter: 'Word Filter',
  link_filter: 'Link Filter',
  spam_detection: 'Spam Detection',
  caps_filter: 'Caps Filter',
};

const ACTION_LABELS: Record<string, string> = {
  delete: 'Delete',
  warn: 'Warn',
  mute: 'Mute',
  flag_for_review: 'Flag for Review',
};

const ACTION_COLORS: Record<string, string> = {
  delete: '#ef4444',
  warn: '#f59e0b',
  mute: '#f97316',
  flag_for_review: '#3b82f6',
};

const RULE_TYPES = ['word_filter', 'link_filter', 'spam_detection', 'caps_filter'] as const;
const ACTIONS = ['delete', 'warn', 'mute', 'flag_for_review'] as const;

/**
 * Automod settings screen for managing group automod rules.
 */
export default function AutomodSettingsScreen({ route }: Props) {
  const { groupId } = route.params;
  const { colors } = useThemeStore();
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create/Edit form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('word_filter');
  const [formPattern, setFormPattern] = useState('');
  const [formAction, setFormAction] = useState<string>('delete');
  const [editingRule, setEditingRule] = useState<AutomodRule | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/groups/${groupId}/automod_rules`);
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setRules(
        data.map((r: Record<string, unknown>) => ({
           
          id: (r.id ?? '') as string,
           
          name: (r.name ?? '') as string,
           
          ruleType: (r.rule_type ?? r.ruleType ?? '') as string,
           
          pattern: (r.pattern ?? '') as string,
           
          action: (r.action ?? 'delete') as string,
           
          isEnabled: (r.is_enabled ?? r.isEnabled ?? true) as boolean,
        }))
      );
    } catch {
      Alert.alert('Error', 'Failed to load automod rules');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = async (rule: AutomodRule) => {
    try {
      await api.patch(`/api/v1/groups/${groupId}/automod_rules/${rule.id}`, {
        is_enabled: !rule.isEnabled,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
      );
    } catch {
      Alert.alert('Error', 'Failed to toggle rule');
    }
  };

  const handleDelete = (rule: AutomodRule) => {
    Alert.alert('Delete Rule', `Delete "${rule.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/groups/${groupId}/automod_rules/${rule.id}`);
            setRules((prev) => prev.filter((r) => r.id !== rule.id));
          } catch {
            Alert.alert('Error', 'Failed to delete rule');
          }
        },
      },
    ]);
  };

  const openCreateForm = () => {
    setEditingRule(null);
    setFormName('');
    setFormType('word_filter');
    setFormPattern('');
    setFormAction('delete');
    setShowCreateModal(true);
  };

  const openEditForm = (rule: AutomodRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormType(rule.ruleType);
    setFormPattern(rule.pattern);
    setFormAction(rule.action);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPattern.trim()) {
      Alert.alert('Required', 'Name and pattern are required');
      return;
    }

    setSaving(true);
    try {
      if (editingRule) {
        await api.patch(`/api/v1/groups/${groupId}/automod_rules/${editingRule.id}`, {
          name: formName.trim(),
          rule_type: formType,
          pattern: formPattern.trim(),
          action: formAction,
        });
      } else {
        await api.post(`/api/v1/groups/${groupId}/automod_rules`, {
          name: formName.trim(),
          rule_type: formType,
          pattern: formPattern.trim(),
          action: formAction,
        });
      }
      setShowCreateModal(false);
      fetchRules();
    } catch {
      Alert.alert('Error', 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const getPatternHint = (type: string) => {
    switch (type) {
      case 'word_filter':
        return 'Comma-separated words to block (e.g., spam,scam,phishing)';
      case 'link_filter':
        return 'Comma-separated domains to block (e.g., bit.ly,tinyurl.com)';
      case 'spam_detection':
        return 'Message threshold count (e.g., 5)';
      case 'caps_filter':
        return 'Uppercase percentage threshold (e.g., 70)';
      default:
        return 'Pattern for this rule type';
    }
  };

  const renderRule = ({ item, index }: { item: AutomodRule; index: number }) => (
    <Animated.View
      entering={FadeInDown.springify().delay(index * 40)}
      exiting={FadeOutRight.duration(200)}
    >
      <TouchableOpacity
        style={[styles.ruleCard, { backgroundColor: colors.surface }]}
        onPress={() => openEditForm(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.ruleHeader}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: (ACTION_COLORS[item.action] || colors.primary) + '20' },
            ]}
          >
            <Ionicons
              name={
                 
                (RULE_TYPE_ICONS[item.ruleType] ||
                  'shield-outline') as keyof typeof Ionicons.glyphMap
              }
              size={20}
              color={ACTION_COLORS[item.action] || colors.primary}
            />
          </View>
          <View style={styles.ruleInfo}>
            <Text style={[styles.ruleName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: colors.background }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {RULE_TYPE_LABELS[item.ruleType] || item.ruleType}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: (ACTION_COLORS[item.action] || colors.primary) + '15' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: ACTION_COLORS[item.action] || colors.primary },
                  ]}
                >
                  {ACTION_LABELS[item.action] || item.action}
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={item.isEnabled}
            onValueChange={() => handleToggle(item)}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={item.isEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
        <Text style={[styles.patternPreview, { color: colors.textTertiary }]} numberOfLines={1}>
          {item.pattern}
        </Text>
      </TouchableOpacity>
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
        data={rules}
        keyExtractor={(item) => item.id}
        renderItem={renderRule}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Automod Rules</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add rules to automatically moderate messages
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openCreateForm}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingRule ? 'Edit Rule' : 'New Rule'}
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formName}
                onChangeText={setFormName}
                placeholder="Rule name"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.optionsRow}>
                {RULE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: formType === t ? colors.primary + '20' : colors.background,
                        borderColor: formType === t ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFormType(t)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: formType === t ? colors.primary : colors.text },
                      ]}
                    >
                      {RULE_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Pattern</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formPattern}
                onChangeText={setFormPattern}
                placeholder={getPatternHint(formType)}
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Action</Text>
              <View style={styles.optionsRow}>
                {ACTIONS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor:
                          formAction === a
                            ? (ACTION_COLORS[a] || colors.primary) + '20'
                            : colors.background,
                        borderColor:
                          formAction === a ? ACTION_COLORS[a] || colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFormAction(a)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            formAction === a ? ACTION_COLORS[a] || colors.primary : colors.text,
                        },
                      ]}
                    >
                      {ACTION_LABELS[a]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingRule ? 'Save' : 'Create'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 80, gap: 10 },
  ruleCard: { borderRadius: 14, padding: 14, gap: 8 },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleInfo: { flex: 1, gap: 4 },
  ruleName: { fontSize: 15, fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  patternPreview: { fontSize: 12, marginLeft: 52 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
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
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  optionText: { fontSize: 13, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
