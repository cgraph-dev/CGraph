/**
 * Carousel - Horizontal Swipeable Carousel Component
 *
 * A premium carousel with smooth animations, pagination dots,
 * auto-play, and parallax effects.
 *
 * Features:
 * - Smooth horizontal scrolling
 * - Animated pagination dots
 * - Auto-play with configurable interval
 * - Parallax effects on items
 * - Loop mode (infinite scroll)
 * - Snap to item
 * - Haptic feedback on snap
 * - Custom item rendering
 * - Peek mode (show adjacent items)
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CarouselItem {
  id: string;
  [key: string]: unknown;
}

export interface CarouselProps<T extends CarouselItem> {
  /** Data items to render */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number, scrollX: Animated.Value) => React.ReactNode;
  /** Item width (default: screen width - 40) */
  itemWidth?: number;
  /** Spacing between items */
  spacing?: number;
  /** Show pagination dots */
  showPagination?: boolean;
  /** Enable auto-play */
  autoPlay?: boolean;
  /** Auto-play interval in ms */
  autoPlayInterval?: number;
  /** Enable loop mode */
  loop?: boolean;
  /** Enable parallax effect */
  parallax?: boolean;
  /** Initial item index */
  initialIndex?: number;
  /** Callback when active item changes */
  onActiveIndexChange?: (index: number) => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Show peek of adjacent items */
  peek?: boolean;
  /** Peek amount (pixels visible of adjacent items) */
  peekAmount?: number;
  /** Enable haptic feedback on snap */
  hapticFeedback?: boolean;
}

export default function Carousel<T extends CarouselItem>({
  data,
  renderItem,
  itemWidth = SCREEN_WIDTH - 40,
  spacing = 12,
  showPagination = true,
  autoPlay = false,
  autoPlayInterval = 4000,
  loop = false,
  initialIndex = 0,
  onActiveIndexChange,
  style,
  peek = false,
  peekAmount = 30,
  hapticFeedback = true,
}: CarouselProps<T>) {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const actualItemWidth = peek ? itemWidth - peekAmount * 2 : itemWidth;
  const snapInterval = actualItemWidth + spacing;
  const contentOffset = peek ? (SCREEN_WIDTH - actualItemWidth) / 2 - spacing : 0;

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && data.length > 1) {
      autoPlayRef.current = setInterval(() => {
        const nextIndex = (activeIndex + 1) % data.length;
        scrollToIndex(nextIndex);
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, activeIndex, data.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: index * snapInterval,
          animated: true,
        });
      }
    },
    [snapInterval]
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / snapInterval);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < data.length) {
        if (hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setActiveIndex(newIndex);
        onActiveIndexChange?.(newIndex);
      }
    },
    [activeIndex, snapInterval, data.length, hapticFeedback, onActiveIndexChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    // Pause auto-play when user starts dragging
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return (
        <View
          style={[
            styles.itemContainer,
            {
              width: actualItemWidth,
              marginHorizontal: spacing / 2,
            },
          ]}
        >
          {renderItem(item, index, scrollX)}
        </View>
      );
    },
    [actualItemWidth, spacing, renderItem, scrollX]
  );

  const renderPagination = () => {
    if (!showPagination || data.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {data.map((_, index) => {
          const inputRange = [
            (index - 1) * snapInterval,
            index * snapInterval,
            (index + 1) * snapInterval,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paginationDotGradient}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        bounces={!loop}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: contentOffset || spacing / 2 },
        ]}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        initialScrollIndex={initialIndex}
      />
      {renderPagination()}
    </View>
  );
}

// Parallax image helper component
export function ParallaxImage({
  source,
  scrollX,
  index,
  itemWidth,
  style,
}: {
  source: { uri: string };
  scrollX: Animated.Value;
  index: number;
  itemWidth: number;
  style?: ViewStyle;
}) {
  const inputRange = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];

  const translateX = scrollX.interpolate({
    inputRange,
    outputRange: [-itemWidth * 0.2, 0, itemWidth * 0.2],
    extrapolate: 'clamp',
  });

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [1.2, 1, 1.2],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.parallaxContainer, style]}>
      <Animated.Image
        source={source}
        style={[
          styles.parallaxImage,
          {
            transform: [{ translateX }, { scale }],
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

// Scale animation helper for items
export function ScaleItem({
  children,
  scrollX,
  index,
  itemWidth,
  style,
}: {
  children: React.ReactNode;
  scrollX: Animated.Value;
  index: number;
  itemWidth: number;
  style?: ViewStyle;
}) {
  const inputRange = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  paginationDotGradient: {
    flex: 1,
    borderRadius: 4,
  },
  parallaxContainer: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  parallaxImage: {
    width: '120%',
    height: '100%',
    left: '-10%',
  },
});
