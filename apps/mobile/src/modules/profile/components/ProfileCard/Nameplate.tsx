/**
 * Nameplate — styled username display with theme-based effects.
 *
 * Supports multiple nameplate styles with glow, color, and font effects.
 *
 * @module profile/components/ProfileCard/Nameplate
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

/** Badge data shape */
interface Badge {
  id: string;
  name: string;
  imageUrl: string;
}

/** Visual configuration for a nameplate style */
interface NameplateStyle {
  color: string;
  shadowColor?: string;
  shadowRadius?: number;
  fontStyle?: 'normal' | 'italic';
}

/** Built-in nameplate styles registry */
const NAMEPLATE_STYLES: Record<string, NameplateStyle> = {
  default: { color: '#ffffff' },
  gold: { color: '#f0a500', shadowColor: '#f0a500', shadowRadius: 6 },
  neon_cyan: { color: '#00f5ff', shadowColor: '#00f5ff', shadowRadius: 8 },
  neon_pink: { color: '#ff6b9d', shadowColor: '#ff6b9d', shadowRadius: 8 },
  gothic: { color: '#c0c0c0', fontStyle: 'italic' },
  neon_purple: { color: '#c44dff', shadowColor: '#c44dff', shadowRadius: 8 },
  fire: { color: '#ff4500', shadowColor: '#ff4500', shadowRadius: 6 },
  ice: { color: '#00bfff', shadowColor: '#00bfff', shadowRadius: 6 },
};

interface NameplateProps {
  /** User ID */
  userId: string;
  /** Display name to render */
  displayName: string;
  /** Nameplate style ID from the registry */
  nameplateId?: string;
  /** Badges to show after the name */
  badges?: Badge[];
}

/**
 * Styled username display component.
 * Applies nameplate-specific colors, glows, and font styles.
 */
export function Nameplate({ displayName, nameplateId, badges }: NameplateProps) {
  const style = NAMEPLATE_STYLES[nameplateId ?? 'default'] ?? NAMEPLATE_STYLES.default;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.name,
          {
            color: style.color,
            fontStyle: style.fontStyle ?? 'normal',
            ...(style.shadowColor && {
              textShadowColor: style.shadowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: style.shadowRadius ?? 0,
            }),
          },
        ]}
        numberOfLines={1}
      >
        {displayName}
      </Text>

      {badges && badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map((badge) => (
            <Image
              key={badge.id}
              source={{ uri: badge.imageUrl }}
              style={styles.badge}
              resizeMode="contain"
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** Export the styles registry for external use (e.g., picker) */
export { NAMEPLATE_STYLES };
export type { NameplateStyle, Badge };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    width: 20,
    height: 20,
  },
});
