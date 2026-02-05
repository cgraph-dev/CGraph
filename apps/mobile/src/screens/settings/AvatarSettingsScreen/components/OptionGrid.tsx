/**
 * OptionGrid - Grid of selectable options
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

import { OptionGridProps } from '../types';
import { styles } from '../styles';

export function OptionGrid({ options, selected, onSelect, columns = 4 }: OptionGridProps) {
  return (
    <View style={[styles.optionGrid, { flexWrap: 'wrap' }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            { width: `${100 / columns - 2}%` },
            selected === option && styles.optionButtonSelected,
          ]}
          onPress={() => {
            HapticFeedback.light();
            onSelect(option);
          }}
        >
          <Text
            style={[
              styles.optionButtonText,
              selected === option && styles.optionButtonTextSelected,
            ]}
          >
            {option.replace('-', '\n')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
