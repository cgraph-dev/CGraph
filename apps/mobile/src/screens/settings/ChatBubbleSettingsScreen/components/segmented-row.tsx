import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedRowProps {
  label: string;
  options: SegmentedOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentedRow({ label, options, selected, onSelect }: SegmentedRowProps) {
  return (
    <View style={styles.optionRowVertical}>
      <Text style={styles.optionLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentedControl}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentedOption,
              selected === opt.value && styles.segmentedOptionSelected,
            ]}
            onPress={() => {
              HapticFeedback.light();
              onSelect(opt.value);
            }}
          >
            <Text
              style={[
                styles.segmentedOptionText,
                selected === opt.value && styles.segmentedOptionTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  optionRowVertical: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  segmentedControl: {
    marginTop: 10,
  },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  segmentedOptionSelected: {
    backgroundColor: '#10b981',
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  segmentedOptionTextSelected: {
    color: '#fff',
  },
});
