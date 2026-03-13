/**
 * Animated heatmap cell with opacity and scale entrance animation.
 * @module components/visualization/heatmap/components/heatmap-cell
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { SPRING_PRESETS } from '../../../../lib/animations/animation-library';
import { styles } from '../styles';

interface HeatmapCellProps {
  cell: {
    date: Date;
    value: number;
    color: string;
    weekIndex: number;
    dayIndex: number;
  };
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  animated: boolean;
  animationDelay: number;
  onPress: () => void;
}

/** Description. */
/** Heatmap Cell component. */
export function HeatmapCell({
  cell,
  cellSize,
  cellGap,
  cellRadius,
  animated,
  animationDelay,
  onPress,
}: HeatmapCellProps) {
  const opacity = useSharedValue(animated ? 0 : 1);
  const scale = useSharedValue(animated ? 0.5 : 1);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { duration: durations.normal.ms, easing: Easing.out(Easing.ease) })
      );
      scale.value = withDelay(animationDelay, withSpring(1, SPRING_PRESETS.bouncy));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const left = cell.weekIndex * (cellSize + cellGap);
  const top = cell.dayIndex * (cellSize + cellGap);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.cell,
          {
            position: 'absolute',
            left,
            top,
            width: cellSize,
            height: cellSize,
            borderRadius: cellRadius,
            backgroundColor: cell.color,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
}
