/**
 * SettingsTab - Admin settings navigation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';

export interface SettingsTabProps {
  onNavigate: (screen: string) => void;
}

const settingsGroups = [
  {
    title: 'General',
    items: [
      { id: 'site', label: 'Site Settings', icon: 'globe', screen: 'SiteSettings' },
      {
        id: 'registration',
        label: 'Registration',
        icon: 'person-add',
        screen: 'RegistrationSettings',
      },
      { id: 'email', label: 'Email Configuration', icon: 'mail', screen: 'EmailSettings' },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'forums', label: 'Forum Management', icon: 'chatbubbles', screen: 'ForumManagement' },
      { id: 'moderation', label: 'Moderation Rules', icon: 'shield', screen: 'ModerationRules' },
      { id: 'badwords', label: 'Word Filters', icon: 'ban', screen: 'WordFilters' },
    ],
  },
  {
    title: 'Security',
    items: [
      { id: 'permissions', label: 'Permissions', icon: 'key', screen: 'Permissions' },
      { id: 'bans', label: 'Ban Management', icon: 'hand-left', screen: 'BanManagement' },
      { id: 'api', label: 'API Keys', icon: 'code', screen: 'ApiKeys' },
    ],
  },
];

/**
 * Settings Tab component.
 *
 */
export function SettingsTab({ onNavigate }: SettingsTabProps) {
  return (
    <View style={styles.tabContent}>
      {settingsGroups.map((group) => (
        <View key={group.title} style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>{group.title}</Text>
          <View style={styles.settingsCard}>
            {group.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingsItem,
                  index < group.items.length - 1 && styles.settingsItemBorder,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  onNavigate(item.screen);
                }}
              >
                <View style={styles.settingsItemIcon}>
                  <Ionicons
                     
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color="#10b981"
                  />
                </View>
                <Text style={styles.settingsItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
  },
  settingsGroup: {
    marginBottom: 20,
  },
  settingsGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
});

export default SettingsTab;
