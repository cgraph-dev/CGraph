/**
 * Tab Bar — Sliding pill variant with badge support
 *
 * Complements existing animated-tab-bar.tsx (211 lines) with an
 * Instagram-style sliding pill indicator that moves between tabs.
 *
 * Features:
 * - Animated sliding pill indicator between tabs (Reanimated)
 * - Unread count badges on tab icons
 * - Filled icon when active, outline when inactive
 * - Safe-area aware bottom inset
 * - Label visibility toggle
 *
 * @module navigation/tab-bar
 */

import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// ── Types ──────────────────────────────────────────────────────────────

interface TabBadges {
  [routeName: string]: number;
}

interface SlidingTabBarProps extends BottomTabBarProps {
  badges?: TabBadges;
  showLabels?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PILL_PADDING = 16;

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Sliding Tab Bar component. */
export function SlidingTabBar({
  state,
  descriptors,
  navigation,
  badges = {},
  showLabels = true,
}: SlidingTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;
  const tabWidth = (SCREEN_WIDTH - PILL_PADDING * 2) / tabCount;
  const pillX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    pillX.value = withSpring(state.index * tabWidth, {
      damping: 22,
      stiffness: 350,
    });
  }, [state.index, tabWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: tabWidth,
  }));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Sliding pill */}
      <View style={styles.pillTrack}>
        <Animated.View style={[styles.pill, pillStyle]} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const badgeCount = badges[route.name] || 0;

          const handlePress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Use tabBarIcon from options
          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? '#6366f1' : 'rgba(255,255,255,0.35)',
            size: 24,
          });

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <View style={styles.iconWrap}>
                {icon}
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                  </View>
                )}
              </View>
              {showLabels && (
                <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111214',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: PILL_PADDING,
    paddingTop: 6,
  },
  pillTrack: {
    position: 'absolute',
    top: 0,
    left: PILL_PADDING,
    right: PILL_PADDING,
    height: 48,
  },
  pill: {
    position: 'absolute',
    top: 4,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tabs: {
    flexDirection: 'row',
    height: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#111214',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
  },
  labelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
});

export default SlidingTabBar;
