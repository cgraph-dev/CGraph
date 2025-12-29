import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type ProgressBarProps = {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export default function ProgressBar({
  value,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const heights = {
    sm: 4,
    md: 8,
    lg: 12,
  };
  
  const colorMap = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };
  
  const height = heights[size];
  const barColor = colorMap[color];

  return (
    <View style={[styles.container, style]}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          )}
          {showLabel && (
            <Text style={[styles.percentage, { color: colors.textSecondary }]}>
              {Math.round(clampedValue)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: height / 2,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedValue}%`,
              backgroundColor: barColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
