/**
 * Content options toggles for export wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ExportOptions } from './export-types';

interface OptionToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function OptionToggle({ label, value, onChange }: OptionToggleProps) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={() => {
        HapticFeedback.light();
        onChange(!value);
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

interface ContentOptionsProps {
  options: ExportOptions;
  onUpdateOption: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void;
}

/** Description. */
/** Content Options component. */
export function ContentOptions({ options, onUpdateOption }: ContentOptionsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Content Options</Text>
      <BlurView intensity={40} tint="dark" style={styles.optionsCard}>
        <OptionToggle
          label="Include replies"
          value={options.includeReplies}
          onChange={(v) => onUpdateOption('includeReplies', v)}
        />
        <OptionToggle
          label="Include images"
          value={options.includeImages}
          onChange={(v) => onUpdateOption('includeImages', v)}
        />
        <OptionToggle
          label="Include timestamps"
          value={options.includeTimestamps}
          onChange={(v) => onUpdateOption('includeTimestamps', v)}
        />
        <OptionToggle
          label="Include usernames"
          value={options.includeUsernames}
          onChange={(v) => onUpdateOption('includeUsernames', v)}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  optionsCard: { borderRadius: 12, overflow: 'hidden' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionLabel: { fontSize: 15, color: '#fff' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' },
});
