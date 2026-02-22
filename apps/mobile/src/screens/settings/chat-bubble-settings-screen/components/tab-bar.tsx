import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tabs, TabId } from '../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => {
            HapticFeedback.light();
            onTabChange(tab.id);
          }}
        >
          <Ionicons
            name={tab.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={activeTab === tab.id ? '#10b981' : '#6b7280'}
          />
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#10b981',
  },
});
