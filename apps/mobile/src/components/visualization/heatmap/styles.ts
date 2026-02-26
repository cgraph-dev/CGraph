/**
 * Styles for the heatmap visualization components.
 * @module components/visualization/heatmap/styles
 */
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  gridContainer: {},
  monthLabels: {
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    color: '#9ca3af',
    fontSize: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  weekdayLabels: {
    position: 'relative',
  },
  weekdayLabel: {
    position: 'absolute',
    color: '#9ca3af',
    fontSize: 10,
    right: 4,
  },
  grid: {
    position: 'relative',
  },
  cell: {},
  tooltip: {
    marginTop: 12,
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  legendLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginHorizontal: 4,
  },
  legendCell: {},
  matrixContainer: {},
  columnLabels: {
    flexDirection: 'row',
  },
  rowLabels: {},
  matrixRow: {
    flexDirection: 'row',
  },
  matrixLabel: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'center',
    justifyContent: 'center',
  },
  matrixGrid: {},
  matrixGridRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  matrixValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
