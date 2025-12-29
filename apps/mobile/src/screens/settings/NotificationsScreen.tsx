import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Notifications'>;
};

export default function NotificationsScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  
  const [settings, setSettings] = useState({
    pushEnabled: true,
    messages: true,
    mentions: true,
    replies: true,
    groupActivity: true,
    forumActivity: true,
    friendRequests: true,
    marketing: false,
  });
  
  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  
  const notificationSettings = [
    {
      title: 'Push Notifications',
      key: 'pushEnabled' as const,
      description: 'Receive push notifications on this device',
    },
  ];
  
  const messageSettings = [
    {
      title: 'Direct Messages',
      key: 'messages' as const,
      description: 'When someone sends you a direct message',
    },
    {
      title: 'Mentions',
      key: 'mentions' as const,
      description: 'When someone mentions you in a message',
    },
    {
      title: 'Replies',
      key: 'replies' as const,
      description: 'When someone replies to your message',
    },
  ];
  
  const activitySettings = [
    {
      title: 'Group Activity',
      key: 'groupActivity' as const,
      description: 'Updates from groups you are a member of',
    },
    {
      title: 'Forum Activity',
      key: 'forumActivity' as const,
      description: 'Replies and activity on your posts',
    },
    {
      title: 'Friend Requests',
      key: 'friendRequests' as const,
      description: 'When someone sends you a friend request',
    },
  ];
  
  const otherSettings = [
    {
      title: 'Marketing',
      key: 'marketing' as const,
      description: 'Product updates and announcements',
    },
  ];
  
  const renderSwitch = (item: { title: string; key: keyof typeof settings; description: string }) => (
    <View key={item.key} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <Switch
        value={settings[item.key]}
        onValueChange={() => toggleSetting(item.key)}
        trackColor={{ false: colors.surfaceHover, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>General</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Other</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {otherSettings.map(renderSwitch)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
