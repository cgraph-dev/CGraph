import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardCategory, TimePeriod, CATEGORIES, TIME_PERIODS } from './leaderboard-types';

interface CategoryFiltersProps {
  category: LeaderboardCategory;
  timePeriod: TimePeriod;
  onCategoryChange: (category: LeaderboardCategory) => void;
  onTimePeriodChange: (period: TimePeriod) => void;
  categoryColor: string;
  colors: Record<string, string>;
}

export function CategoryFilters({
  category,
  timePeriod,
  onCategoryChange,
  onTimePeriodChange,
  categoryColor,
  colors,
}: CategoryFiltersProps) {
  return (
    <>
      {/* Time Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timePeriodContainer}
      >
        {TIME_PERIODS.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.timePeriodTab,
              { backgroundColor: colors.surface },
              timePeriod === period.key && { backgroundColor: categoryColor + '30' },
            ]}
            onPress={() => onTimePeriodChange(period.key)}
          >
            <Text
              style={[
                styles.timePeriodText,
                { color: colors.textSecondary },
                timePeriod === period.key && { color: categoryColor },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              { backgroundColor: colors.surface },
              category === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color },
            ]}
            onPress={() => onCategoryChange(cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={18}
              color={category === cat.key ? cat.color : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryText,
                { color: colors.textSecondary },
                category === cat.key && { color: cat.color },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  timePeriodContainer: { paddingBottom: 12, gap: 8 },
  timePeriodTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  timePeriodText: { fontSize: 14, fontWeight: '500' },
  categoryContainer: { paddingBottom: 16, gap: 8 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryText: { fontSize: 14, fontWeight: '500' },
});
