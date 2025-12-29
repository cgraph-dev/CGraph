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
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Privacy'>;
};

export default function PrivacyScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    readReceipts: true,
    allowDMs: true,
    allowGroupInvites: true,
    profileVisibility: true,
  });
  
  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  
  const privacySettings = [
    {
      title: 'Show Online Status',
      key: 'showOnlineStatus' as const,
      description: 'Let others see when you are online',
    },
    {
      title: 'Show Last Seen',
      key: 'showLastSeen' as const,
      description: 'Let others see when you were last active',
    },
    {
      title: 'Read Receipts',
      key: 'readReceipts' as const,
      description: 'Let others see when you read their messages',
    },
  ];
  
  const messageSettings = [
    {
      title: 'Allow Direct Messages',
      key: 'allowDMs' as const,
      description: 'Let anyone send you direct messages',
    },
    {
      title: 'Allow Group Invites',
      key: 'allowGroupInvites' as const,
      description: 'Let anyone invite you to groups',
    },
  ];
  
  const profileSettings = [
    {
      title: 'Public Profile',
      key: 'profileVisibility' as const,
      description: 'Let anyone view your profile',
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Activity Status</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {privacySettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Messaging</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {messageSettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Profile</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {profileSettings.map(renderSwitch)}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Your privacy settings help control who can see your information and contact you.
          Changes may take a few minutes to take effect.
        </Text>
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
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
});
