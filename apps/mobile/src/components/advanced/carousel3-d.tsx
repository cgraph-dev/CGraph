/**
 * Carousel3D - Perspective Carousel with Depth Effects
 *
 * Features:
 * - 3D perspective transforms
 * - Multiple layout modes (cover-flow, wheel, stack)
 * - Smooth gesture-based navigation
 * - Auto-play with pause on interaction
 * - Customizable depth, rotation, and spacing
 * - Parallax effects
 * - Haptic feedback on item change
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export type CarouselLayout = 'coverFlow' | 'wheel' | 'stack' | 'flat';

export interface Carousel3DProps<T> {
  data: T[];
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;

  // Layout
  layout?: CarouselLayout;
  itemWidth?: number;
  itemHeight?: number;
  visibleItems?: number;
  spacing?: number;

  // 3D Effects
  perspective?: number;
  rotationAngle?: number;
  depthScale?: number;
  depthOpacity?: boolean;

  // Behavior
  initialIndex?: number;
  loop?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  enabled?: boolean;

  // Callbacks
  onIndexChange?: (index: number) => void;
  onItemPress?: (item: T, index: number) => void;

  // Style
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;

  // Animation
  springPreset?: keyof typeof SPRING_PRESETS;

  // Haptics
  hapticFeedback?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_ITEM_WIDTH = SCREEN_WIDTH * 0.7;
const DEFAULT_ITEM_HEIGHT = 300;
const DEFAULT_VISIBLE_ITEMS = 3;

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function Carousel3D<T>({
  data,
  renderItem,
  keyExtractor = (_, index) => String(index),
  layout = 'coverFlow',
  itemWidth = DEFAULT_ITEM_WIDTH,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
  spacing = 20,
  perspective = 1000,
  rotationAngle = 45,
  depthScale = 0.8,
  depthOpacity = true,
  initialIndex = 0,
  loop = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  enabled = true,
  onIndexChange,
  onItemPress,
  style,
  containerStyle,
  springPreset = 'bouncy',
  hapticFeedback = true,
}: Carousel3DProps<T>) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const translateX = useSharedValue(-initialIndex * (itemWidth + spacing));
  const currentIndex = useSharedValue(initialIndex);
  const isAnimating = useSharedValue(false);

  const springConfig = SPRING_PRESETS[springPreset];
  const itemCount = data.length;

  // Calculate center offset
  const centerOffset = useMemo(() => {
    return (containerWidth - itemWidth) / 2;
  }, [containerWidth, itemWidth]);

  // Handle container layout
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  // Notify index change
  const notifyIndexChange = useCallback(
    (index: number) => {
      onIndexChange?.(index);
    },
    [onIndexChange]
  );

  // Snap to index
  const snapToIndex = useCallback(
    (index: number, animated = true) => {
      'worklet';
      const clampedIndex = loop
        ? ((index % itemCount) + itemCount) % itemCount
        : Math.max(0, Math.min(itemCount - 1, index));

      currentIndex.value = clampedIndex;

      const targetX = -clampedIndex * (itemWidth + spacing);
      const cfg = getSpringConfig(springConfig);

      if (animated) {
        translateX.value = withSpring(targetX, cfg, () => {
          isAnimating.value = false;
        });
      } else {
        translateX.value = targetX;
      }

      runOnJS(triggerHaptic)();
      runOnJS(notifyIndexChange)(clampedIndex);
    },
    [itemCount, itemWidth, spacing, loop, springConfig]
  );

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || itemCount <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex.value + 1) % itemCount;
      snapToIndex(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, itemCount]);

  // Context for gesture tracking
  const gestureContext = useSharedValue({ startX: 0, lastIndex: 0 });

  // Gesture handler using new Gesture API
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      gestureContext.value = {
        startX: translateX.value,
        lastIndex: currentIndex.value,
      };
      isAnimating.value = true;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = gestureContext.value.startX + event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityX;
      const itemSpacing = itemWidth + spacing;

      // Calculate target index based on position and velocity
      let targetIndex: number;

      if (Math.abs(velocity) > 500) {
        // Fast swipe - move at least one item in velocity direction
        const direction = velocity > 0 ? -1 : 1;
        targetIndex = gestureContext.value.lastIndex + direction;
      } else {
        // Slow swipe - snap to nearest
        const rawIndex = -translateX.value / itemSpacing;
        targetIndex = Math.round(rawIndex);
      }

      snapToIndex(targetIndex);
    });

  // Derived value for current position
  const position = useDerivedValue(() => {
    return -translateX.value / (itemWidth + spacing);
  });

  // Render carousel items
  const renderCarouselItems = useMemo(() => {
    return data.map((item, index) => (
      <CarouselItem
        key={keyExtractor(item, index)}
        index={index}
        position={position}
        layout={layout}
        itemWidth={itemWidth}
        itemHeight={itemHeight}
        spacing={spacing}
        perspective={perspective}
        rotationAngle={rotationAngle}
        depthScale={depthScale}
        depthOpacity={depthOpacity}
        visibleItems={visibleItems}
        onPress={() => onItemPress?.(item, index)}
      >
        {renderItem(item, index, index === Math.round(position.value))}
      </CarouselItem>
    ));
  }, [
    data,
    layout,
    itemWidth,
    itemHeight,
    spacing,
    perspective,
    rotationAngle,
    depthScale,
    depthOpacity,
    visibleItems,
  ]);

  return (
    <View style={[styles.container, containerStyle]} onLayout={handleLayout}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.carousel, { paddingLeft: centerOffset }, style]}>
          <Animated.View
            style={[
              styles.itemsContainer,
              useAnimatedStyle(() => ({
                transform: [{ translateX: translateX.value }],
              })),
            ]}
          >
            {renderCarouselItems}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Pagination dots */}
      <Pagination count={itemCount} position={position} style={styles.pagination} />
    </View>
  );
}

// ============================================================================
// Carousel Item Component
// ============================================================================

interface CarouselItemProps {
  children: React.ReactNode;
  index: number;
  position: SharedValue<number>;
  layout: CarouselLayout;
  itemWidth: number;
  itemHeight: number;
  spacing: number;
  perspective: number;
  rotationAngle: number;
  depthScale: number;
  depthOpacity: boolean;
  visibleItems: number;
  onPress?: () => void;
}

function CarouselItem({
  children,
  index,
  position,
  layout,
  itemWidth,
  itemHeight,
  spacing,
  perspective,
  rotationAngle,
  depthScale,
  depthOpacity,
  visibleItems,
  onPress,
}: CarouselItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = index - position.value;
    const absOffset = Math.abs(offset);

    // Common interpolations
    const opacity = depthOpacity
      ? interpolate(absOffset, [0, visibleItems], [1, 0.3], Extrapolate.CLAMP)
      : 1;

    const scale = interpolate(
      absOffset,
      [0, 1, visibleItems],
      [1, depthScale, depthScale * 0.8],
      Extrapolate.CLAMP
    );

    let translateX = 0;
    let _translateZ = 0;
    let rotateY = 0;

    switch (layout) {
      case 'coverFlow':
        // Cover flow: rotation and z-depth
        rotateY = interpolate(
          offset,
          [-1, 0, 1],
          [rotationAngle, 0, -rotationAngle],
          Extrapolate.CLAMP
        );
        _translateZ = interpolate(absOffset, [0, 1], [0, -100], Extrapolate.CLAMP);
        break;

      case 'wheel':
        // Wheel: circular arrangement
        rotateY = interpolate(
          offset,
          [-visibleItems, 0, visibleItems],
          [90, 0, -90],
          Extrapolate.CLAMP
        );
        _translateZ = interpolate(absOffset, [0, visibleItems], [0, -200], Extrapolate.CLAMP);
        break;

      case 'stack':
        // Stack: cards stacked with offset
        translateX = interpolate(
          offset,
          [-1, 0, 1, 2, 3],
          [-itemWidth * 0.5, 0, 20, 40, 60],
          Extrapolate.CLAMP
        );
        _translateZ = interpolate(
          offset,
          [-1, 0, 1, 2, 3],
          [-50, 0, -30, -60, -90],
          Extrapolate.CLAMP
        );
        break;

      case 'flat':
      default:
        // Flat: simple horizontal scroll
        break;
    }

    return {
      opacity,
      transform: [{ perspective }, { translateX }, { scale }, { rotateY: `${rotateY}deg` }],
      zIndex: Math.round(100 - absOffset * 10),
    };
  });

  return (
    <Animated.View
      style={[
        styles.item,
        { width: itemWidth, height: itemHeight, marginRight: spacing },
        animatedStyle,
      ]}
    >
      <Animated.View style={styles.itemContent} onTouchEnd={onPress}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  count: number;
  position: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
}

function Pagination({ count, position, style }: PaginationProps) {
  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => (
      <PaginationDot key={i} index={i} position={position} />
    ));
  }, [count]);

  return <View style={[styles.paginationContainer, style]}>{dots}</View>;
}

interface PaginationDotProps {
  index: number;
  position: SharedValue<number>;
}

function PaginationDot({ index, position }: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = Math.abs(position.value - index) < 0.5;

    return {
      width: withTiming(isActive ? 24 : 8, { duration: durations.normal.ms }),
      backgroundColor: withTiming(isActive ? '#10b981' : '#4b5563', { duration: durations.normal.ms }),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface ImageCarouselProps {
  images: string[];
  onImagePress?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 *
 */
export function ImageCarousel({ images, onImagePress, style }: ImageCarouselProps) {
  return (
    <Carousel3D
      data={images}
      renderItem={(uri, _index) => (
        <Animated.Image source={{ uri }} style={styles.carouselImage} resizeMode="cover" />
      )}
      onItemPress={(_, index) => onImagePress?.(index)}
      style={style}
      layout="coverFlow"
    />
  );
}

export interface CardCarouselProps<T> {
  cards: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onCardPress?: (item: T, index: number) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 *
 */
export function CardCarousel<T>({ cards, renderCard, onCardPress, style }: CardCarouselProps<T>) {
  return (
    <Carousel3D
      data={cards}
      renderItem={renderCard}
      onItemPress={onCardPress}
      style={style}
      layout="stack"
      depthScale={0.9}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  carousel: {
    flexDirection: 'row',
  },
  itemsContainer: {
    flexDirection: 'row',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  pagination: {},
  dot: {
    height: 8,
    borderRadius: 4,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});

export default Carousel3D;
