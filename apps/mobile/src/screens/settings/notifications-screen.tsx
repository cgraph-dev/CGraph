/**
 * Notifications settings screen for managing push and email notification preferences.
 * @module screens/settings/notifications-screen
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NotificationSettings, useSettingsStore, useThemeStore } from '@/stores';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Notifications'>;
};

type SettingKey = keyof NotificationSettings;

interface SettingItem {
  title: string;
  key: SettingKey;
  description: string;
}

/**
 *
 */
export default function NotificationsScreen({ navigation: _navigation }: Props) {
  const { colors } = useThemeStore();
  const { settings, updateNotificationSettings, isLoading, isSaving, fetchSettings } = useSettingsStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchSettings().finally(() => setHasLoaded(true));
  }, [fetchSettings]);

  const toggleSetting = useCallback(async (key: SettingKey) => {
    const currentValue = settings.notifications[key];
    if (typeof currentValue !== 'boolean') return;
    
    try {
      await updateNotificationSettings({ [key]: !currentValue });
    } catch {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  }, [settings.notifications, updateNotificationSettings]);
  
  const notificationSettings: SettingItem[] = [
    {
      title: '📲 Push Notifications',
      key: 'pushNotifications',
      description: 'Receive push notifications on this device',
    },
    {
      title: '📧 Email Notifications',
      key: 'emailNotifications',
      description: 'Receive notifications via email',
    },
  ];
  
  const messageSettings: SettingItem[] = [
    {
      title: 'Direct Messages',
      key: 'notifyMessages',
      description: 'When someone sends you a direct message',
    },
    {
      title: '@ Mentions',
      key: 'notifyMentions',
      description: 'When someone mentions you in a message',
    },
    {
      title: 'Forum Replies',
      key: 'notifyForumReplies',
      description: 'When someone replies to your post',
    },
  ];
  
  const activitySettings: SettingItem[] = [
    {
      title: 'Group Invites',
      key: 'notifyGroupInvites',
      description: 'When you are invited to a group',
    },
    {
      title: 'Friend Requests',
      key: 'notifyFriendRequests',
      description: 'When someone sends you a friend request',
    },
  ];
  
  const soundSettings: SettingItem[] = [
    {
      title: '🔔 Notification Sound',
      key: 'notificationSound',
      description: 'Play a sound for notifications',
    },
  ];
  
  const renderSwitch = (item: SettingItem) => {
    const value = settings.notifications[item.key];
    const boolValue = typeof value === 'boolean' ? value : false;
    
    return (
      <View key={item.key} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <Switch
          value={boolValue}
          onValueChange={() => toggleSetting(item.key)}
          disabled={isSaving}
          trackColor={{ false: colors.surfaceHover, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    );
  };

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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>⚡ General</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {notificationSettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Messages</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {messageSettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Activity</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {activitySettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sound</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {soundSettings.map(renderSwitch)}
        </View>
      </View>

      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving...</Text>
        </View>
      )}
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
});
