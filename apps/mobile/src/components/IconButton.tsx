import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface IconButtonProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Icon color override */
  color?: string;
}

const SIZES = {
  sm: { button: 32, icon: 18 },
  md: { button: 40, icon: 22 },
  lg: { button: 48, icon: 26 },
};

export default function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  onPress,
  disabled = false,
  style,
  color,
}: IconButtonProps) {
  const { colors } = useTheme();
  const sizeConfig = SIZES[size];

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSecondary;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'danger':
        return '#ef4444';
      case 'ghost':
        return 'transparent';
      default:
        return colors.surfaceSecondary;
    }
  };

  const getIconColor = () => {
    if (color) return color;
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#ffffff';
      case 'ghost':
        return colors.text;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: sizeConfig.button,
          height: sizeConfig.button,
          borderRadius: sizeConfig.button / 2,
          backgroundColor: getBackgroundColor(),
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={sizeConfig.icon} color={getIconColor()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
