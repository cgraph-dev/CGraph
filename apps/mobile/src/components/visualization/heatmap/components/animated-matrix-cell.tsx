/**
 * Animated matrix cell for the MatrixHeatmap variant.
 * @module components/visualization/heatmap/components/animated-matrix-cell
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { styles } from '../styles';

interface AnimatedMatrixCellProps {
  value: number;
  color: string;
  cellSize: number;
  cellGap: number;
  rowIndex: number;
  colIndex: number;
  cols: number;
  animated: boolean;
  showValues: boolean;
}

/** Description. */
/** Animated Matrix Cell component. */
export function AnimatedMatrixCell({
  value,
  color,
  cellSize,
  cellGap,
  rowIndex,
  colIndex,
  cols,
  animated,
  showValues,
}: AnimatedMatrixCellProps) {
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(
        (rowIndex * cols + colIndex) * 20,
        withTiming(1, { duration: durations.slow.ms })
      );
    }
  }, [animated, rowIndex, cols, colIndex, opacity]);

  const animatedCellStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.matrixCell,
        {
          width: cellSize,
          height: cellSize,
          backgroundColor: color,
          margin: cellGap / 2,
        },
        animatedCellStyle,
      ]}
    >
      {showValues && <Animated.Text style={styles.matrixValue}>{value.toFixed(1)}</Animated.Text>}
    </Animated.View>
  );
}
