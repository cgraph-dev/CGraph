/**
 * Divider — horizontal/vertical separator with optional label for mobile.
 * @module components/ui/divider
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  style?: ViewStyle;
}

export function Divider({ orientation = 'horizontal', label, style }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <View style={[styles.vertical, style]} />
    );
  }

  if (label) {
    return (
      <View style={[styles.labelRow, style]}>
        <View style={styles.line} />
        <Text style={styles.labelText}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.horizontal, style]} />;
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.30)',
  },
});

export default Divider;
