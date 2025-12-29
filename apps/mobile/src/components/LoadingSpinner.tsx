import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Loading text */
  text?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

export default function LoadingSpinner({
  size = 'large',
  text,
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && (
        <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});
