import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional styles */
  style?: ViewStyle;
}

const PADDING = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) {
  const { colors } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.surface,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {};
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        { padding: PADDING[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
