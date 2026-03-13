/**
 * VisibilityOption component for profile visibility settings.
 * @module screens/settings/profile-visibility-screen/visibility-option
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { VISIBILITY_OPTIONS } from './types';
import { styles } from './styles';

interface VisibilityOptionProps {
  option: (typeof VISIBILITY_OPTIONS)[0];
  isSelected: boolean;
  onSelect: () => void;
}

/** Description. */
/** Visibility Option component. */
export function VisibilityOption({ option, isSelected, onSelect }: VisibilityOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.visibilityOption, isSelected && styles.visibilityOptionSelected]}
      onPress={() => {
        HapticFeedback.light();
        onSelect();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.visibilityIcon, isSelected && styles.visibilityIconSelected]}>
        <Ionicons name={option.icon} size={24} color={isSelected ? '#10b981' : '#6b7280'} />
      </View>
      <View style={styles.visibilityInfo}>
        <Text style={[styles.visibilityLabel, isSelected && styles.visibilityLabelSelected]}>
          {option.label}
        </Text>
        <Text style={styles.visibilityDescription}>{option.description}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
    </TouchableOpacity>
  );
}
