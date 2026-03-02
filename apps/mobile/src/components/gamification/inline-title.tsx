/**
 * InlineTitle - Mobile
 *
 * Lightweight component for displaying a user's equipped title
 * next to their username, with rarity-based color styling.
 *
 * @module components/gamification/inline-title
 */

import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// ── Types ──

export type TitleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';

export interface TitleData {
  name: string;
  color?: string;
  rarity: TitleRarity;
}

export interface InlineTitleProps {
  title: TitleData | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

// ── Rarity Colors ──

const RARITY_COLORS: Record<TitleRarity, string> = {
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
  mythic: '#f472b6',
  unique: '#f43f5e',
};

const GRADIENT_RARITIES: Record<string, [string, string, ...string[]]> = {
  epic: ['#a78bfa', '#7c3aed'],
  legendary: ['#fbbf24', '#f59e0b'],
  mythic: ['#f472b6', '#ec4899', '#a855f7'],
  unique: ['#f43f5e', '#fbbf24', '#22c55e', '#3b82f6', '#a855f7'],
};

const SIZES: Record<string, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

// ── Component ──

/**
 * Renders a user's equipped title with rarity-appropriate styling.
 * 
 * For common/uncommon/rare rarities: solid color text
 * For epic+ rarities: gradient text using MaskedView + LinearGradient
 */
export default function InlineTitle({ title, size = 'sm' }: InlineTitleProps) {
  if (!title) return null;

  const fontSize = SIZES[size] ?? SIZES.sm;
  const gradientColors = GRADIENT_RARITIES[title.rarity];

  // Epic+ rarities get gradient text
  if (gradientColors) {
    return (
      <MaskedView
        maskElement={
          <Text style={[styles.title, { fontSize }]}>
            {title.name}
          </Text>
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.title, { fontSize, opacity: 0 }]}>
            {title.name}
          </Text>
        </LinearGradient>
      </MaskedView>
    );
  }

  // Common/uncommon/rare get solid color
  const color = title.color || RARITY_COLORS[title.rarity] || RARITY_COLORS.common;

  return (
    <Text style={[styles.title, { fontSize, color }]}>
      {title.name}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '600',
    marginLeft: 4,
  },
});
