/**
 * Frequency Picker — horizontal feed mode selector bar.
 *
 * Renders a horizontal ScrollView with 5 discovery mode tabs:
 * trending, fresh, following, recommended, nearby.
 * Highlights the active mode with primary color.
 *
 * @module components/discovery/frequency-picker
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import type { FeedMode } from '@/stores/discoveryStore';

// ---------------------------------------------------------------------------
// Mode metadata
// ---------------------------------------------------------------------------

interface ModeOption {
  readonly key: FeedMode;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  { key: 'trending', label: 'Trending', icon: 'flame-outline' },
  { key: 'fresh', label: 'Fresh', icon: 'time-outline' },
  { key: 'following', label: 'Following', icon: 'people-outline' },
  { key: 'recommended', label: 'For You', icon: 'sparkles-outline' },
  { key: 'nearby', label: 'Nearby', icon: 'location-outline' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FrequencyPickerProps {
  readonly activeMode: FeedMode;
  readonly onModeChange: (mode: FeedMode) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Horizontal feed mode selector bar for discovery feed.
 */
export default function FrequencyPicker({ activeMode, onModeChange }: FrequencyPickerProps) {
  const { colors } = useThemeStore();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {MODE_OPTIONS.map((opt) => {
          const isActive = opt.key === activeMode;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onModeChange(opt.key)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                isActive
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={isActive ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.tabLabel, { color: isActive ? '#fff' : colors.textSecondary }]}>
                {opt.label}
              </Text>
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
  },
  container: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
