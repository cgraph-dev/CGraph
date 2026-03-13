/**
 * LoadingState - Loading indicator for notifications
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface LoadingStateProps {
  colors: {
    background: string;
    textSecondary: string;
  };
}

/**
 * Loading State component.
 *
 */
export function LoadingState({ colors }: LoadingStateProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#3b82f6', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
      <Text style={[styles.text, { color: colors.textSecondary }]}>Loading notifications...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
  },
});

export default LoadingState;
