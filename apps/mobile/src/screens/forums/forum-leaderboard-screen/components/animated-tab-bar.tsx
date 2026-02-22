/**
 * AnimatedTabBar Component
 *
 * Tab bar for switching between forums and contributors with:
 * - Animated sliding indicator with gradient
 * - Scale animations for active tab icon
 * - Haptic feedback on tab change
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../contexts/theme-context';
import { LeaderboardType } from '../../forum-leaderboard-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface TabBarProps {
  activeTab: LeaderboardType;
  onTabChange: (tab: LeaderboardType) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimatedTabBar({ activeTab, onTabChange, colors }: TabBarProps) {
  const indicatorAnim = useRef(new Animated.Value(activeTab === 'forums' ? 0 : 1)).current;
  const forumsScale = useRef(new Animated.Value(activeTab === 'forums' ? 1.1 : 1)).current;
  const contributorsScale = useRef(
    new Animated.Value(activeTab === 'contributors' ? 1.1 : 1)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorAnim, {
        toValue: activeTab === 'forums' ? 0 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(forumsScale, {
        toValue: activeTab === 'forums' ? 1.1 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(contributorsScale, {
        toValue: activeTab === 'contributors' ? 1.1 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, indicatorAnim, forumsScale, contributorsScale]);

  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 32) / 2],
  });

  return (
    <View style={styles.tabBarContainer}>
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX: indicatorTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabIndicatorGradient}
        />
      </Animated.View>

      {/* Forums tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('forums');
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: forumsScale }] }}>
          <Ionicons name="grid" size={20} color={activeTab === 'forums' ? '#FFF' : '#9CA3AF'} />
        </Animated.View>
        <Text style={[styles.tabLabel, activeTab === 'forums' && styles.tabLabelActive]}>
          Top Forums
        </Text>
      </TouchableOpacity>

      {/* Contributors tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('contributors');
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: contributorsScale }] }}>
          <Ionicons
            name="trophy"
            size={20}
            color={activeTab === 'contributors' ? '#FFF' : '#9CA3AF'}
          />
        </Animated.View>
        <Text style={[styles.tabLabel, activeTab === 'contributors' && styles.tabLabelActive]}>
          Top Users
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
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
    gap: 8,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#FFF',
  },
});
