/**
 * TabBar - Admin dashboard navigation tabs
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tabs } from '../types';
import type { AdminTab } from '../types';

export interface TabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingReports: number;
}

/**
 *
 */
export function TabBar({ activeTab, onTabChange, pendingReports }: TabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBar}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => {
            HapticFeedback.light();
            onTabChange(tab.id);
          }}
        >
          <View style={styles.tabIconContainer}>
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#10b981' : '#9ca3af'}
            />
            {tab.id === 'reports' && pendingReports > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {pendingReports > 9 ? '9+' : pendingReports}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  tabLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tabLabelActive: {
    color: '#10b981',
    fontWeight: '600',
  },
});

export default TabBar;
