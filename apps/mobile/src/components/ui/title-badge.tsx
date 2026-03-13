/**
 * TitleBadge — displays a user title with rarity-based styling.
 * @module components/ui/title-badge
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface TitleBadgeProps {
  title: string;
  rarity?: Rarity;
  animation?: 'shimmer' | 'none';
  showSparkles?: boolean;
}

const RARITY_COLORS: Record<Rarity, { bg: string; text: string; border: string }> = {
  common: { bg: '#374151', text: '#d1d5db', border: '#4b5563' },
  uncommon: { bg: '#064e3b', text: '#6ee7b7', border: '#10b981' },
  rare: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f6' },
  epic: { bg: '#2e1065', text: '#a78bfa', border: '#8b5cf6' },
  legendary: { bg: '#451a03', text: '#fbbf24', border: '#f59e0b' },
  mythic: { bg: '#4a0e2b', text: '#f472b6', border: '#ec4899' },
};

/** Description. */
/** Title Badge component. */
export function TitleBadge({
  title,
  rarity = 'common',
  animation: _animation = 'none',
  showSparkles = false,
}: TitleBadgeProps) {
  const colors = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {showSparkles && <Text style={styles.sparkle}>✨</Text>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showSparkles && <Text style={styles.sparkle}>✨</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sparkle: {
    fontSize: 10,
  },
});
