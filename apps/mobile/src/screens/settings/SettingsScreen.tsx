import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;
};

const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};

export default function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  
  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          title: 'Edit Profile',
          icon: 'person-outline' as const,
          onPress: () => navigation.navigate('Profile'),
        },
        {
          title: 'Account',
          icon: 'lock-closed-outline' as const,
          onPress: () => navigation.navigate('Account'),
        },
        {
          title: 'Privacy',
          icon: 'shield-outline' as const,
          onPress: () => navigation.navigate('Privacy'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Appearance',
          icon: 'color-palette-outline' as const,
          onPress: () => navigation.navigate('Appearance'),
        },
        {
          title: 'Notifications',
          icon: 'notifications-outline' as const,
          onPress: () => navigation.navigate('Notifications'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          title: 'Help & Support',
          icon: 'help-circle-outline' as const,
          onPress: () => {},
        },
        {
          title: 'Terms of Service',
          icon: 'document-text-outline' as const,
          onPress: () => {},
        },
        {
          title: 'Privacy Policy',
          icon: 'shield-checkmark-outline' as const,
          onPress: () => {},
        },
      ],
    },
  ];
  
  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Profile Card */}
      <TouchableOpacity
        style={[styles.profileCard, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.profileAvatar}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user?.display_name || user?.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{user?.username}
          </Text>
          {user?.karma !== undefined && (
            <View style={styles.karmaRow}>
              <Ionicons name="trophy" size={14} color="#F59E0B" />
              <Text style={[styles.karmaText, { color: colors.textSecondary }]}>
                {formatKarma(user.karma)} karma
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.settingsItem,
                  index < section.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={[styles.settingsItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
      
      {/* Version */}
      <Text style={[styles.version, { color: colors.textTertiary }]}>
        CGraph v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  profileAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  karmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  karmaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 32,
  },
});
