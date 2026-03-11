/**
 * Topic Selector — horizontal chip list for topic filtering.
 *
 * Renders a horizontal ScrollView of topic chips with multi-select.
 * Selected topics filter the discovery feed.
 *
 * @module components/discovery/topic-selector
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopicSelectorProps {
  readonly topics: string[];
  readonly selected: string[];
  readonly onToggle: (topic: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Horizontal topic chip selector for feed filtering.
 */
export default function TopicSelector({ topics, selected, onToggle }: TopicSelectorProps) {
  const { colors } = useThemeStore();

  if (topics.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Ionicons name="pricetag-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Topics</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {topics.map((topic) => {
          const isSelected = selected.includes(topic);
          return (
            <TouchableOpacity
              key={topic}
              onPress={() => onToggle(topic)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: colors.primary + '22', borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.primary : colors.textSecondary },
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {topic}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  container: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
});
