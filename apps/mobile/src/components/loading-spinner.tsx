/**
 * Loading spinner component with optional text label and full-screen overlay mode.
 * @module components/LoadingSpinner
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/stores';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Loading text */
  text?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Optional testID for testing */
  testID?: string;
}

/**
 *
 */
export default function LoadingSpinner({
  size = 'large',
  text,
  fullScreen = false,
  style,
  testID = 'loading-spinner',
}: LoadingSpinnerProps) {
  const { colors } = useThemeStore();

  const content = (
    <View style={[styles.container, style]} testID={fullScreen ? `${testID}-content` : testID}>
      <ActivityIndicator size={size} color={colors.primary} testID={`${testID}-indicator`} />
      {text && (
        <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]} testID={`${testID}-fullscreen`}>
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
