/**
 * SliderRow - Adjustable slider with +/- buttons
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import { SliderRowProps } from '../types';
import { styles } from '../styles';

export function SliderRow({ label, value, min, max, step = 1, onValueChange }: SliderRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
              onValueChange(Math.max(min, value - step));
            }}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
              onValueChange(Math.min(max, value + step));
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
