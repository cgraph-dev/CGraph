/**
 * PresenceStatusScreen - Set presence status on mobile
 * Online, Idle, DND, Invisible
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

interface StatusOption {
  value: PresenceStatus;
  label: string;
  description: string;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'online', label: 'Online', description: 'You will appear online to others', color: '#22c55e' },
  { value: 'idle', label: 'Idle', description: 'You will appear as away', color: '#eab308' },
  { value: 'dnd', label: 'Do Not Disturb', description: 'Suppress all notifications', color: '#ef4444' },
  { value: 'invisible', label: 'Invisible', description: 'Appear offline but stay connected', color: '#6b7280' },
];

export default function PresenceStatusScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<PresenceStatus>('online');
  const [updating, setUpdating] = useState(false);

  const handleSelect = async (newStatus: PresenceStatus) => {
    setUpdating(true);
    try {
      await api.put('/api/v1/me', { status: newStatus });
      setStatus(newStatus);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.springify().delay(50)}>
        <Text style={[styles.header, { color: colors.text }]}>Set Your Status</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose how you appear to others
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {STATUS_OPTIONS.map((option, index) => (
          <Animated.View key={option.value} entering={FadeInDown.springify().delay(100 + index * 50)}>
            <TouchableOpacity
              onPress={() => handleSelect(option.value)}
              disabled={updating}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: status === option.value ? option.color : colors.border,
                  borderWidth: status === option.value ? 2 : 1,
                  opacity: updating ? 0.6 : 1,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: option.color }]} />
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              {status === option.value && (
                <Text style={{ color: option.color, fontSize: 16 }}>✓</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
});
