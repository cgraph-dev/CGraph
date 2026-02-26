/**
 * EmptyNotifications - Empty state display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { TabType } from '../types';

export interface EmptyNotificationsProps {
  activeTab: TabType;
  colors: {
    text: string;
    textSecondary: string;
  };
}

/**
 *
 */
export function EmptyNotifications({ activeTab, colors }: EmptyNotificationsProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name="notifications-off" size={48} color="#fff" />
      </LinearGradient>
      <Text style={[styles.title, { color: colors.text }]}>No notifications</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {activeTab === 'unread'
          ? "You're all caught up! 🎉"
          : 'When you get notifications, they will appear here'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyNotifications;
