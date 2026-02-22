/**
 * QuickLink - Navigation link with gradient styling
 *
 * Features:
 * - Gradient background with icon
 * - Haptic feedback on press
 * - Chevron indicator
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';

export interface QuickLinkProps {
  icon: string;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

export function QuickLink({ icon, label, description, color, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color + '20', '#1f2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '30' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default QuickLink;
