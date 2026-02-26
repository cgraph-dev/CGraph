/**
 * Matrix Heatmap variant for 2D data grids.
 * @module components/visualization/heatmap/matrix-heatmap
 */
import React, { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedMatrixCell } from './components/animated-matrix-cell';
import type { MatrixHeatmapProps } from './types';
import { styles } from './styles';

/**
 *
 */
export function MatrixHeatmap({
  data,
  rowLabels,
  columnLabels,
  cellSize = 40,
  cellGap = 2,
  colorScale = ['#1e3a5f', '#2563eb', '#60a5fa', '#93c5fd', '#dbeafe'],
  showValues = true,
  animated = true,
  style,
}: MatrixHeatmapProps) {
  const { minValue, maxValue } = useMemo(() => {
    const flat = data.flat();
    return {
      minValue: Math.min(...flat),
      maxValue: Math.max(...flat),
    };
  }, [data]);

  const getColor = useCallback(
    (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const index = Math.min(
        Math.floor(normalized * (colorScale.length - 1)),
        colorScale.length - 1
      );
      return colorScale[index];
    },
    [minValue, maxValue, colorScale]
  );

  const cols = data[0]?.length || 0;
  const labelWidth = rowLabels ? 60 : 0;

  return (
    <View style={[styles.matrixContainer, style]}>
      {columnLabels && (
        <View style={[styles.columnLabels, { marginLeft: labelWidth }]}>
          {columnLabels.map((label, index) => (
            <Animated.Text
              key={`col-${index}`}
              style={[styles.matrixLabel, { width: cellSize + cellGap }]}
            >
              {label}
            </Animated.Text>
          ))}
        </View>
      )}

      <View style={styles.matrixRow}>
        {rowLabels && (
          <View style={[styles.rowLabels, { width: labelWidth }]}>
            {rowLabels.map((label, index) => (
              <Animated.Text
                key={`row-${index}`}
                style={[styles.matrixLabel, { height: cellSize + cellGap }]}
              >
                {label}
              </Animated.Text>
            ))}
          </View>
        )}

        <View style={styles.matrixGrid}>
          {data.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.matrixGridRow}>
              {row.map((value, colIndex) => (
                <AnimatedMatrixCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  value={value}
                  color={getColor(value)}
                  cellSize={cellSize}
                  cellGap={cellGap}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  cols={cols}
                  animated={animated}
                  showValues={showValues}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
