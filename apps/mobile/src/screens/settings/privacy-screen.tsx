/**
 * Privacy settings screen for managing user privacy preferences.
 * @module screens/settings/privacy-screen
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsStore, useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Privacy'>;
};

type BooleanSettingKey =
  | 'showOnlineStatus'
  | 'showReadReceipts'
  | 'showTypingIndicators'
  | 'allowFriendRequests'
  | 'allowMessageRequests'
  | 'showInSearch'
  | 'showProfileToStranger'
  | 'allowGroupInvites'
  | 'showLastSeen'
  | 'showActivityStatus'
  | 'allowForumInvites'
  | 'shareAnalytics'
  | 'showBadges'
  | 'allowNonFriendDM'
  | 'hideFromDiscover';

interface SettingItem {
  title: string;
  key: BooleanSettingKey;
  description: string;
}

/**
 * Privacy settings screen — allows toggling 15 privacy-related preferences.
 */
export default function PrivacyScreen({ navigation: _navigation }: Props) {
  const { colors } = useThemeStore();
  const { settings, updatePrivacySettings, isLoading, isSaving, fetchSettings } =
    useSettingsStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchSettings().finally(() => setHasLoaded(true));
  }, [fetchSettings]);

  const toggleSetting = useCallback(
    async (key: BooleanSettingKey) => {
       
      const currentValue = (settings.privacy as unknown as Record<string, boolean>)[key];

      try {
        await updatePrivacySettings({ [key]: !currentValue });
      } catch {
        Alert.alert('Error', 'Failed to save settings. Please try again.');
      }
    },
    [settings.privacy, updatePrivacySettings]
  );

  const generalSettings: SettingItem[] = [
    {
      title: 'Show Online Status',
      key: 'showOnlineStatus',
      description: 'Let others see when you are online',
    },
    {
      title: 'Show Last Seen',
      key: 'showLastSeen',
      description: 'Show when you were last active',
    },
    {
      title: 'Show Typing Indicators',
      key: 'showTypingIndicators',
      description: 'Let others see when you are typing',
    },
    {
      title: 'Show Activity Status',
      key: 'showActivityStatus',
      description: 'Show what you are doing (playing, listening)',
    },
    {
      title: 'Read Receipts',
      key: 'showReadReceipts',
      description: 'Let others see when you read their messages',
    },
  ];

  const messagingSettings: SettingItem[] = [
    {
      title: 'Allow Direct Messages',
      key: 'allowMessageRequests',
      description: 'Let anyone send you direct messages',
    },
    {
      title: 'Allow Non-Friend DMs',
      key: 'allowNonFriendDM',
      description: 'Allow direct messages from people not on your friend list',
    },
    {
      title: 'Allow Friend Requests',
      key: 'allowFriendRequests',
      description: 'Let anyone send you friend requests',
    },
  ];

  const socialSettings: SettingItem[] = [
    {
      title: 'Show in Search',
      key: 'showInSearch',
      description: 'Let others find you in search results',
    },
    {
      title: 'Show Profile to Strangers',
      key: 'showProfileToStranger',
      description: 'Allow non-friends to view your full profile',
    },
    {
      title: 'Allow Group Invites',
      key: 'allowGroupInvites',
      description: 'Allow others to invite you to groups',
    },
    {
      title: 'Allow Forum Invites',
      key: 'allowForumInvites',
      description: 'Allow others to invite you to forums',
    },
    {
      title: 'Show Badges',
      key: 'showBadges',
      description: 'Display your earned badges publicly on your profile',
    },
    {
      title: 'Hide from Discover',
      key: 'hideFromDiscover',
      description: 'Hide your profile from the discovery feed',
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      title: 'Share Analytics',
      key: 'shareAnalytics',
      description: 'Share anonymous usage data to help improve the app',
    },
  ];

  const renderSwitch = (item: SettingItem) => (
    <View key={item.key} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <Switch
         
        value={(settings.privacy as unknown as Record<string, boolean>)[item.key]}
        onValueChange={() => toggleSetting(item.key)}
        disabled={isSaving}
        trackColor={{ false: colors.surfaceHover, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  if (!hasLoaded && isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>General</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {generalSettings.map(renderSwitch)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Messaging</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {messagingSettings.map(renderSwitch)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Social</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {socialSettings.map(renderSwitch)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {dataSettings.map(renderSwitch)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Profile Visibility
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Profile Visibility</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {settings.privacy.profileVisibility === 'public'
                  ? 'Everyone can see your profile'
                  : settings.privacy.profileVisibility === 'friends'
                    ? 'Only friends can see your profile'
                    : 'Your profile is private'}
              </Text>
            </View>
            <Text style={[styles.visibilityValue, { color: colors.primary }]}>
              {settings.privacy.profileVisibility.charAt(0).toUpperCase() +
                settings.privacy.profileVisibility.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Your privacy settings help control who can see your information and contact you. Changes
          are saved automatically.
        </Text>
      </View>
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
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  visibilityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
});
