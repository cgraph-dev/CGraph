/**
 * AnimatedTabBar – Custom bottom tab bar with Reanimated v4 spring physics.
 *
 * Features:
 * - Spring-animated icon scale on select (1 → 1.15)
 * - Bounce on tap via withSequence
 * - Animated active indicator dot below icon
 * - Haptic feedback on tab press
 *
 * @module navigation/components/AnimatedTabBar
 */
import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SPRING_PRESETS } from '@/lib/animations/animation-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Tab Item
// ---------------------------------------------------------------------------
function TabItem({
  route,
  descriptor,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: BottomTabBarProps['state']['routes'][number];
  descriptor: BottomTabBarProps['descriptors'][string];
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useThemeStore();
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(isFocused ? 1 : 0);

  // Update dot when focus changes
  React.useEffect(() => {
    dotScale.value = withSpring(isFocused ? 1 : 0, SPRING_PRESETS.snappy);
  }, [isFocused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Bounce sequence
    scale.value = withSequence(
      withSpring(0.85, SPRING_PRESETS.snappy),
      withSpring(isFocused ? 1.15 : 1.0, SPRING_PRESETS.bouncy),
    );
    onPress();
  };

  // Keep focused scale
  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1.0, SPRING_PRESETS.snappy);
  }, [isFocused]);

  const { options } = descriptor;
  const label =
    typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : typeof options.title === 'string'
        ? options.title
        : route.name;

  const tintColor = isFocused ? colors.primary : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      <Animated.View style={iconAnimStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: tintColor,
          size: 24,
        })}
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          { color: tintColor, fontWeight: isFocused ? '600' : '400' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      {/* Active indicator dot */}
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: colors.primary },
          dotAnimStyle,
        ]}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Tab Bar
// ---------------------------------------------------------------------------
/**
 *
 */
export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 4),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            descriptor={descriptor}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});

export default AnimatedTabBar;
