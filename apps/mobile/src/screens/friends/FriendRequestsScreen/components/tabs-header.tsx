/**
 * TabsHeader Component
 *
 * Animated tabs for switching between incoming and outgoing requests.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import type { TabsHeaderProps, TabType } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TabsHeader({
  activeTab,
  onTabPress,
  incomingCount,
  outgoingCount,
}: TabsHeaderProps) {
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'incoming' ? 0 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabIndicatorPosition]);

  const handleTabPress = (tab: TabType) => {
    Haptics.selectionAsync();
    onTabPress(tab);
  };

  const indicatorTranslateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
  });

  return (
    <View style={styles.tabsWrapper}>
      <GlassCard variant="frosted" intensity="medium" style={styles.tabsContainer}>
        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={activeTab === 'incoming' ? ['#8B5CF6', '#6366F1'] : ['#06B6D4', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabIndicatorGradient}
          />
        </Animated.View>

        {/* Tab Buttons */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('incoming')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-down-circle"
            size={20}
            color={activeTab === 'incoming' ? '#FFF' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
            Incoming
          </Text>
          {incomingCount > 0 && (
            <View style={[styles.badge, activeTab === 'incoming' && styles.badgeActive]}>
              <Text style={styles.badgeText}>{incomingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('outgoing')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-up-circle"
            size={20}
            color={activeTab === 'outgoing' ? '#FFF' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.tabTextActive]}>
            Sent
          </Text>
          {outgoingCount > 0 && (
            <View style={[styles.badge, activeTab === 'outgoing' && styles.badgeActive]}>
              <Text style={styles.badgeText}>{outgoingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrapper: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    paddingRight: 4,
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFF',
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});
