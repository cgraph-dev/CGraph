/**
 * Legend showing the color scale from Less to More.
 * @module components/visualization/heatmap/components/heatmap-legend
 */
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { styles } from '../styles';

interface HeatmapLegendProps {
  colorScale: string[];
  cellSize: number;
  cellRadius: number;
}

/** Description. */
/** Heatmap Legend component. */
export function HeatmapLegend({ colorScale, cellSize, cellRadius }: HeatmapLegendProps) {
  return (
    <View style={styles.legend}>
      <Animated.Text style={styles.legendLabel}>Less</Animated.Text>
      {colorScale.map((color, index) => (
        <View
          key={`legend-${index}`}
          style={[
            styles.legendCell,
            {
              width: cellSize,
              height: cellSize,
              borderRadius: cellRadius,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      <Animated.Text style={styles.legendLabel}>More</Animated.Text>
    </View>
  );
}
