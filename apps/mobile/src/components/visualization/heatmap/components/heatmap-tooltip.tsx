/**
 * Tooltip displaying selected cell info.
 * @module components/visualization/heatmap/components/heatmap-tooltip
 */
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { HeatmapData } from '../types';
import { styles } from '../styles';

interface HeatmapTooltipProps {
  selectedCell: HeatmapData | null;
}

export function HeatmapTooltip({ selectedCell }: HeatmapTooltipProps) {
  if (!selectedCell) return null;

  return (
    <View style={styles.tooltip}>
      <Animated.Text style={styles.tooltipText}>
        {typeof selectedCell.date === 'string'
          ? selectedCell.date
          : selectedCell.date.toLocaleDateString()}
        : {selectedCell.value} {selectedCell.label || 'contributions'}
      </Animated.Text>
    </View>
  );
}
