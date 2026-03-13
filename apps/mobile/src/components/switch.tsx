/**
 * Themed toggle switch component with optional label and description text.
 * @module components/Switch
 */
import React from 'react';
import { View, Text, Switch as RNSwitch, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useThemeStore } from '@/stores';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Switch component.
 *
 */
export default function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  style,
}: SwitchProps) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        {label && (
          <Text style={[styles.label, { color: disabled ? colors.textSecondary : colors.text }]}>
            {label}
          </Text>
        )}
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        )}
      </View>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        trackColor={{
          false: colors.surfaceSecondary,
          true: colors.primary + '80',
        }}
        thumbColor={value ? colors.primary : colors.textSecondary}
        ios_backgroundColor={colors.surfaceSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
});
