/**
 * SettingsSection - Collapsible settings section container
 */

import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { SectionProps } from '../types';
import { styles } from '../styles';

/**
 * Settings Section component.
 *
 */
export function SettingsSection({ title, icon, iconColor, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */}
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
        {children}
      </BlurView>
    </View>
  );
}
