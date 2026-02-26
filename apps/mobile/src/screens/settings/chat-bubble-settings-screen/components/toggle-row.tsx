/**
 * Toggle switch row component for boolean settings.
 * @module screens/settings/chat-bubble-settings-screen/components/toggle-row
 */
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

/**
 *
 */
export function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionInfo}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          HapticFeedback.light();
          onToggle(newValue);
        }}
        trackColor={{ false: '#4b5563', true: '#10b981' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
});
