/**
 * AnimatedTabBar Component
 *
 * Tab bar for switching between forums and contributors with:
 * - Animated sliding indicator with gradient
 * - Scale animations for active tab icon
 * - Haptic feedback on tab change
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LeaderboardType } from '../../forum-leaderboard-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface TabBarProps {
  activeTab: LeaderboardType;
  onTabChange: (tab: LeaderboardType) => void;
  colors: Record<string, string>;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Animated Tab Bar component.
 *
 */
export function AnimatedTabBar({ activeTab, onTabChange, _colors }: TabBarProps) {
  const indicatorAnim = useSharedValue(activeTab === 'forums' ? 0 : 1);
  const forumsScale = useSharedValue(activeTab === 'forums' ? 1.1 : 1);
  const contributorsScale = useSharedValue(activeTab === 'contributors' ? 1.1 : 1);

  useEffect(() => {
    indicatorAnim.value = withSpring(activeTab === 'forums' ? 0 : 1, {
      damping: 8,
      stiffness: 100,
    });
    forumsScale.value = withSpring(activeTab === 'forums' ? 1.1 : 1, {
      damping: 8,
      stiffness: 100,
    });
    contributorsScale.value = withSpring(activeTab === 'contributors' ? 1.1 : 1, {
      damping: 8,
      stiffness: 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(indicatorAnim.value, [0, 1], [0, (SCREEN_WIDTH - 32) / 2]) },
    ],
  }));

  const forumsScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: forumsScale.value }],
  }));

  const contributorsScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contributorsScale.value }],
  }));

  return (
    <View style={styles.tabBarContainer}>
      {/* Animated indicator */}
      <Animated.View style={[styles.tabIndicator, indicatorAnimStyle]}>
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
        <Animated.View style={forumsScaleStyle}>
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
        <Animated.View style={contributorsScaleStyle}>
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
