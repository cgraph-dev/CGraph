/**
 * ToggleSetting component for profile visibility settings.
 * @module screens/settings/profile-visibility-screen/toggle-setting
 */
import React from 'react';
import { View, Text, Switch } from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { styles } from './styles';

interface ToggleSettingProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Description. */
/** Toggle Setting component. */
export function ToggleSetting({
  label,
  description,
  value,
  onChange,
  disabled,
}: ToggleSettingProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          HapticFeedback.light();
          onChange(v);
        }}
        trackColor={{ false: '#374151', true: '#10b98150' }}
        thumbColor={value ? '#10b981' : '#9ca3af'}
        disabled={disabled}
      />
    </View>
  );
}
