/**
 * Forum settings screen for configuring forum preferences.
 * @module screens/forums/forum-settings-screen
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { ForumsStackParamList, Forum } from '../../types';

// =============================================================================
// FORUM SETTINGS SCREEN
// =============================================================================
// Allows forum moderators/owners to configure forum settings:
// - Basic info (name, description, rules)
// - Privacy settings
// - Moderation settings
// - Post requirements
// - Flair management
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumSettings'>;
  route: RouteProp<ForumsStackParamList, 'ForumSettings'>;
};

interface ForumSettings {
  name: string;
  description: string;
  rules: string;
  is_public: boolean;
  allow_posts: boolean;
  require_flair: boolean;
  require_approval: boolean;
  min_karma_to_post: number;
  min_account_age_days: number;
  nsfw: boolean;
  spoiler_enabled: boolean;
  suggested_sort: 'hot' | 'new' | 'top' | 'controversial';
}

type SettingsSection = {
  title: string;
  description?: string;
  items: SettingsItem[];
};

type SettingsItem = {
  key: keyof ForumSettings;
  label: string;
  description?: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
};

const settingsSections: SettingsSection[] = [
  {
    title: 'Basic Information',
    items: [
      { key: 'name', label: 'Forum Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'rules', label: 'Community Rules', type: 'text' },
    ],
  },
  {
    title: 'Privacy & Access',
    description: 'Control who can view and post in your forum',
    items: [
      {
        key: 'is_public',
        label: 'Public Forum',
        description: 'Anyone can view posts',
        type: 'toggle',
      },
      {
        key: 'allow_posts',
        label: 'Allow Posts',
        description: 'Members can create new posts',
        type: 'toggle',
      },
      {
        key: 'nsfw',
        label: 'NSFW Content',
        description: 'Mark forum as adult content',
        type: 'toggle',
      },
    ],
  },
  {
    title: 'Post Requirements',
    description: 'Set requirements for posting',
    items: [
      {
        key: 'require_flair',
        label: 'Require Flair',
        description: 'Posts must have a flair tag',
        type: 'toggle',
      },
      {
        key: 'require_approval',
        label: 'Require Approval',
        description: 'Posts need moderator approval',
        type: 'toggle',
      },
      {
        key: 'min_karma_to_post',
        label: 'Minimum Karma',
        description: 'Required karma to post',
        type: 'number',
      },
      {
        key: 'min_account_age_days',
        label: 'Account Age (days)',
        description: 'Minimum account age to post',
        type: 'number',
      },
    ],
  },
  {
    title: 'Display Options',
    items: [
      {
        key: 'spoiler_enabled',
        label: 'Enable Spoilers',
        description: 'Allow spoiler tags',
        type: 'toggle',
      },
      {
        key: 'suggested_sort',
        label: 'Default Sort',
        type: 'select',
        options: [
          { label: 'Hot', value: 'hot' },
          { label: 'New', value: 'new' },
          { label: 'Top', value: 'top' },
          { label: 'Controversial', value: 'controversial' },
        ],
      },
    ],
  },
];

/**
 * Forum Settings Screen component.
 *
 */
export default function ForumSettingsScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { colors } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [forum, setForum] = useState<Forum | null>(null);
  const [settings, setSettings] = useState<ForumSettings>({
    name: '',
    description: '',
    rules: '',
    is_public: true,
    allow_posts: true,
    require_flair: false,
    require_approval: false,
    min_karma_to_post: 0,
    min_account_age_days: 0,
    nsfw: false,
    spoiler_enabled: true,
    suggested_sort: 'hot',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchForumSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumId]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Forum Settings',
      headerRight: () =>
        hasChanges ? (
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
            )}
          </TouchableOpacity>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChanges, isSaving, colors]);

  const fetchForumSettings = async () => {
    try {
      const response = await api.get(`/api/v1/forums/${forumId}`);
      const forumData = response.data.data;
      setForum(forumData);
      setSettings({
        name: forumData.name || '',
        description: forumData.description || '',
        rules: forumData.rules || '',
        is_public: forumData.is_public ?? true,
        allow_posts: forumData.allow_posts ?? true,
        require_flair: forumData.require_flair ?? false,
        require_approval: forumData.require_approval ?? false,
        min_karma_to_post: forumData.min_karma_to_post ?? 0,
        min_account_age_days: forumData.min_account_age_days ?? 0,
        nsfw: forumData.nsfw ?? false,
        spoiler_enabled: forumData.spoiler_enabled ?? true,
        suggested_sort: forumData.suggested_sort ?? 'hot',
      });
    } catch (error) {
      console.error('Error fetching forum settings:', error);
      Alert.alert('Error', 'Failed to load forum settings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchForumSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumId]);

  const updateSetting = <K extends keyof ForumSettings>(key: K, value: ForumSettings[K]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/api/v1/forums/${forumId}`, { forum: settings });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      Alert.alert('Success', 'Forum settings saved successfully');
    } catch (error) {
      console.error('Error saving forum settings:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingItem = (item: SettingsItem) => {
    const value = settings[item.key];

    switch (item.type) {
      case 'toggle':
        return (
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
              {item.description && (
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              )}
            </View>
            <Switch
              value={Boolean(value)}
              onValueChange={(val) =>
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                updateSetting(item.key, val as ForumSettings[typeof item.key])
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        );

      case 'text':
        return (
          <View
            style={[styles.settingRow, styles.textInputRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              value={String(value)}
              onChangeText={(text) =>
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                updateSetting(item.key, text as ForumSettings[typeof item.key])
              }
              placeholder={`Enter ${item.label.toLowerCase()}`}
              placeholderTextColor={colors.textSecondary}
              multiline={item.key === 'rules' || item.key === 'description'}
              numberOfLines={item.key === 'rules' ? 4 : item.key === 'description' ? 2 : 1}
            />
          </View>
        );

      case 'number':
        return (
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
              {item.description && (
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              )}
            </View>
            <TextInput
              style={[
                styles.numberInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              value={String(value)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                updateSetting(item.key, (isNaN(num) ? 0 : num) as ForumSettings[typeof item.key]);
              }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        );

      case 'select':
        return (
          <View style={[styles.settingRow, styles.selectRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
            <View style={styles.selectOptions}>
              {item.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor: value === option.value ? colors.primary : colors.surface,
                      borderColor: value === option.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() =>
                    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                    updateSetting(item.key, option.value as ForumSettings[typeof item.key])
                  }
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      { color: value === option.value ? '#fff' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Forum Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.forumName, { color: colors.text }]}>c/{forum?.slug}</Text>
        <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
          {forum?.member_count?.toLocaleString()} members
        </Text>
      </View>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            {section.description && (
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                {section.description}
              </Text>
            )}
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            {section.items.map((item) => (
              <React.Fragment key={item.key}>{renderSettingItem(item)}</React.Fragment>
            ))}
          </View>
        </View>
      ))}

      {/* Danger Zone */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
        </View>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={() =>
              Alert.alert(
                'Delete Forum',
                'Are you sure you want to delete this forum? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await api.delete(`/api/v1/forums/${forumId}`);
                        navigation.goBack();
                      } catch (_error) {
                        Alert.alert('Error', 'Failed to delete forum');
                      }
                    },
                  },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>Delete Forum</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  header: {
    padding: 20,
    marginBottom: 16,
  },
  forumName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  textInputRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  selectRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  textInput: {
    width: '100%',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  numberInput: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    textAlign: 'center',
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
