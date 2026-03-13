/**
 * SelectSetting component for profile visibility settings.
 * @module screens/settings/profile-visibility-screen/select-setting
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { styles } from './styles';

interface SelectSettingProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** Description. */
/** Select Setting component. */
export function SelectSetting({ label, value, options, onChange }: SelectSettingProps) {
  return (
    <View style={styles.selectSetting}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.selectOption, value === option.value && styles.selectOptionSelected]}
            onPress={() => {
              HapticFeedback.light();
              onChange(option.value);
            }}
          >
            <Text
              style={[
                styles.selectOptionText,
                value === option.value && styles.selectOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
