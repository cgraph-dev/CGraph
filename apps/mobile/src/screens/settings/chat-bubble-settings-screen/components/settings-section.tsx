/**
 * Collapsible settings section container with icon and title.
 * @module screens/settings/chat-bubble-settings-screen/components/settings-section
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface SettingsSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}

/**
 * Settings Section component.
 *
 */
export function SettingsSection({ title, icon, iconColor, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}20` }]}>
          { }
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BlurView intensity={30} tint="dark" style={styles.sectionContent}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
});
