/**
 * Tab bar component for switching between attachment picker tabs (photos, camera, contacts, etc.).
 * @module components/attachment-picker/TabBar
 */
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabType, TAB_ITEMS } from '../types';
import { styles } from '../styles';

interface TabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  isDark: boolean;
  textSecondaryColor: string;
}

export function TabBar({ activeTab, onTabPress, isDark, textSecondaryColor }: TabBarProps) {
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? '#1c1c1e' : '#fff',
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
      ]}
    >
      {TAB_ITEMS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <View
            style={[styles.tabIconContainer, activeTab === tab.id && styles.tabIconContainerActive]}
          >
            <Ionicons
              name={tab.icon as keyof typeof Ionicons.glyphMap}
              size={22}
              color={activeTab === tab.id ? '#fff' : textSecondaryColor}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? '#007AFF' : textSecondaryColor },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
