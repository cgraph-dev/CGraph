/**
 * NotificationTabs - Tab bar for notification filtering
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { TabType, tabs } from '../types';

export interface NotificationTabsProps {
  activeTab: TabType;
  unreadCount: number;
  colors: {
    surface: string;
    textSecondary: string;
  };
  onTabChange: (tab: TabType) => void;
}

/**
 *
 */
export function NotificationTabs({
  activeTab,
  unreadCount,
  colors,
  onTabChange,
}: NotificationTabsProps) {
  const renderTab = ({ item }: { item: (typeof tabs)[0] }) => {
    const isActive = activeTab === item.id;

    return (
      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange(item.id);
        }}
      >
        {isActive ? (
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tab}
          >
            <Ionicons name={item.icon} size={16} color="#fff" />
            <Text style={[styles.tabText, { color: '#fff' }]}>{item.label}</Text>
            {item.id === 'unread' && unreadCount > 0 && (
              <View style={styles.tabBadgeActive}>
                <Text style={styles.tabBadgeTextActive}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.tab, { backgroundColor: colors.surface }]}>
            <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }]}>{item.label}</Text>
            {item.id === 'unread' && unreadCount > 0 && (
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabBadge}
              >
                <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </LinearGradient>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={tabs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={renderTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabWrapper: {
    marginRight: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeTextActive: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationTabs;
