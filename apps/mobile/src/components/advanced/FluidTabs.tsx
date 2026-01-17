/**
 * FluidTabs - Animated Tab Bar with Morphing Indicator
 *
 * Features:
 * - Smooth morphing indicator
 * - Multiple indicator styles (pill, underline, background, glow)
 * - Gesture-based tab switching with swipe
 * - Icon and badge support
 * - Animated transitions between tabs
 * - Spring physics
 * - Haptic feedback
 */

import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  Pressable,
  LayoutChangeEvent,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from '../../lib/animations/AnimationLibrary';

// ============================================================================
// Types
// ============================================================================

export type IndicatorStyle = 'pill' | 'underline' | 'background' | 'glow' | 'none';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface FluidTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;

  // Appearance
  indicatorStyle?: IndicatorStyle;
  indicatorColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  backgroundColor?: string;

  // Layout
  variant?: 'fixed' | 'scrollable';
  equalWidth?: boolean;
  tabPadding?: number;

  // Style
  style?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  indicatorHeight?: number;

  // Behavior
  animated?: boolean;
  swipeable?: boolean;

  // Animation
  springPreset?: keyof typeof SPRING_PRESETS;

  // Haptics
  hapticFeedback?: boolean;
}

interface TabLayout {
  x: number;
  width: number;
}

type GestureContext = {
  startX: number;
  startIndex: number;
};

// ============================================================================
// Component
// ============================================================================

export function FluidTabs({
  tabs,
  activeTab,
  onTabChange,
  indicatorStyle = 'pill',
  indicatorColor = '#10b981',
  activeTextColor = '#ffffff',
  inactiveTextColor = '#9ca3af',
  backgroundColor = '#1f2937',
  variant = 'fixed',
  equalWidth = true,
  tabPadding = 16,
  style,
  tabStyle,
  textStyle,
  indicatorHeight = 4,
  animated = true,
  swipeable = false,
  springPreset = 'snappy',
  hapticFeedback = true,
}: FluidTabsProps) {
  const [tabLayouts, setTabLayouts] = useState<Record<string, TabLayout>>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const activeIndex = useSharedValue(0);

  const springConfig = SPRING_PRESETS[springPreset];

  // Find active tab index
  const currentIndex = useMemo(() => {
    return tabs.findIndex((tab) => tab.key === activeTab);
  }, [tabs, activeTab]);

  // Update active index shared value
  useDerivedValue(() => {
    activeIndex.value = currentIndex;
  }, [currentIndex]);

  // Handle container layout
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle tab layout measurement
  const handleTabLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({
      ...prev,
      [key]: { x, width },
    }));
  }, []);

  // Update indicator position when tab layouts or active tab changes
  React.useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (!layout) return;

    if (animated) {
      indicatorX.value = withSpring(layout.x, springConfig);
      indicatorWidth.value = withSpring(layout.width, springConfig);
    } else {
      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
    }
  }, [activeTab, tabLayouts, animated, springConfig]);

  // Handle tab press
  const handleTabPress = useCallback((tab: TabItem) => {
    if (tab.disabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onTabChange(tab.key);
  }, [hapticFeedback, onTabChange]);

  // Gesture handler for swipeable tabs
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = indicatorX.value;
      ctx.startIndex = activeIndex.value;
    },
    onEnd: (event, ctx) => {
      const swipeThreshold = containerWidth / tabs.length / 2;

      if (Math.abs(event.translationX) > swipeThreshold) {
        const direction = event.translationX > 0 ? -1 : 1;
        let newIndex = ctx.startIndex + direction;
        newIndex = Math.max(0, Math.min(tabs.length - 1, newIndex));

        if (newIndex !== ctx.startIndex) {
          const newTab = tabs[newIndex];
          if (newTab && !newTab.disabled) {
            runOnJS(handleTabPress)(newTab);
          }
        }
      }
    },
  });

  // Indicator animated style
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const baseStyle: ViewStyle = {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
    };

    switch (indicatorStyle) {
      case 'pill':
        return {
          ...baseStyle,
          height: '100%',
          borderRadius: 8,
          backgroundColor: indicatorColor,
        };

      case 'underline':
        return {
          ...baseStyle,
          height: indicatorHeight,
          bottom: 0,
          borderRadius: indicatorHeight / 2,
          backgroundColor: indicatorColor,
        };

      case 'background':
        return {
          ...baseStyle,
          height: '80%',
          borderRadius: 12,
          backgroundColor: `${indicatorColor}30`,
        };

      case 'glow':
        return {
          ...baseStyle,
          height: '100%',
          borderRadius: 8,
          backgroundColor: `${indicatorColor}20`,
          shadowColor: indicatorColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
        };

      default:
        return { opacity: 0 };
    }
  });

  // Calculate tab width for equal width mode
  const tabWidth = useMemo(() => {
    if (!equalWidth || variant === 'scrollable') return undefined;
    return containerWidth / tabs.length;
  }, [equalWidth, variant, containerWidth, tabs.length]);

  // Render tabs
  const tabElements = useMemo(() => {
    return tabs.map((tab, index) => (
      <TabButton
        key={tab.key}
        tab={tab}
        index={index}
        isActive={tab.key === activeTab}
        activeIndex={activeIndex}
        width={tabWidth}
        padding={tabPadding}
        activeTextColor={activeTextColor}
        inactiveTextColor={inactiveTextColor}
        tabStyle={tabStyle}
        textStyle={textStyle}
        animated={animated}
        onPress={() => handleTabPress(tab)}
        onLayout={(e) => handleTabLayout(tab.key, e)}
      />
    ));
  }, [tabs, activeTab, tabWidth, tabPadding, activeTextColor, inactiveTextColor, animated, handleTabPress]);

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
      onLayout={handleContainerLayout}
    >
      {/* Indicator */}
      {indicatorStyle !== 'none' && (
        <Animated.View
          style={[
            styles.indicator,
            indicatorAnimatedStyle,
          ]}
        />
      )}

      {/* Tabs */}
      {variant === 'scrollable' ? (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tabElements}
        </ScrollView>
      ) : (
        <View style={styles.tabsRow}>
          {tabElements}
        </View>
      )}
    </View>
  );

  if (swipeable) {
    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View>
          {content}
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return content;
}

// ============================================================================
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  tab: TabItem;
  index: number;
  isActive: boolean;
  activeIndex: Animated.SharedValue<number>;
  width?: number;
  padding: number;
  activeTextColor: string;
  inactiveTextColor: string;
  tabStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  animated: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function TabButton({
  tab,
  index,
  isActive,
  activeIndex,
  width,
  padding,
  activeTextColor,
  inactiveTextColor,
  tabStyle,
  textStyle,
  animated,
  onPress,
  onLayout,
}: TabButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const color = animated
      ? interpolateColor(
          activeIndex.value,
          [index - 1, index, index + 1],
          [inactiveTextColor, activeTextColor, inactiveTextColor]
        )
      : isActive ? activeTextColor : inactiveTextColor;

    return {
      transform: [{ scale: scale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const fontWeight = isActive ? '600' : '400';

    return {
      color: isActive ? activeTextColor : inactiveTextColor,
      fontWeight: fontWeight as any,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
      disabled={tab.disabled}
    >
      <Animated.View
        style={[
          styles.tab,
          width ? { width } : { paddingHorizontal: padding },
          tabStyle,
          animatedStyle,
          tab.disabled && styles.disabledTab,
        ]}
      >
        {/* Icon */}
        {tab.icon && (
          <View style={styles.iconContainer}>
            {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
          </View>
        )}

        {/* Label */}
        <Animated.Text
          style={[styles.tabText, textStyle, textAnimatedStyle]}
          numberOfLines={1}
        >
          {tab.label}
        </Animated.Text>

        {/* Badge */}
        {tab.badge !== undefined && (
          <View style={styles.badge}>
            <Animated.Text style={styles.badgeText}>
              {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
            </Animated.Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface SimpleTabsProps {
  tabs: string[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function SimpleTabs({ tabs, activeIndex, onTabChange, style }: SimpleTabsProps) {
  const tabItems: TabItem[] = useMemo(() => {
    return tabs.map((label, index) => ({
      key: String(index),
      label,
    }));
  }, [tabs]);

  return (
    <FluidTabs
      tabs={tabItems}
      activeTab={String(activeIndex)}
      onTabChange={(key) => onTabChange(parseInt(key, 10))}
      style={style}
    />
  );
}

export interface IconTabsProps {
  tabs: Array<{ icon: React.ReactNode; label: string }>;
  activeIndex: number;
  onTabChange: (index: number) => void;
  showLabels?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconTabs({ tabs, activeIndex, onTabChange, showLabels = true, style }: IconTabsProps) {
  const tabItems: TabItem[] = useMemo(() => {
    return tabs.map((tab, index) => ({
      key: String(index),
      label: showLabels ? tab.label : '',
      icon: tab.icon,
    }));
  }, [tabs, showLabels]);

  return (
    <FluidTabs
      tabs={tabItems}
      activeTab={String(activeIndex)}
      onTabChange={(key) => onTabChange(parseInt(key, 10))}
      indicatorStyle="glow"
      style={style}
    />
  );
}

export interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({ segments, selectedIndex, onValueChange, style }: SegmentedControlProps) {
  const tabItems: TabItem[] = useMemo(() => {
    return segments.map((label, index) => ({
      key: String(index),
      label,
    }));
  }, [segments]);

  return (
    <FluidTabs
      tabs={tabItems}
      activeTab={String(selectedIndex)}
      onTabChange={(key) => onValueChange(parseInt(key, 10))}
      indicatorStyle="pill"
      backgroundColor="#374151"
      indicatorColor="#10b981"
      style={[styles.segmentedControl, style]}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    zIndex: 1,
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 14,
  },
  iconContainer: {
    marginRight: 4,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  segmentedControl: {
    borderRadius: 10,
    padding: 3,
  },
});

export default FluidTabs;
