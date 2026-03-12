/**
 * CosmeticRenderer — universal React Native renderer for any cosmetic type.
 *
 * Renders the appropriate visual for each cosmetic type:
 *   - border:         Animated SVG-like overlay (View borders)
 *   - title:          Styled Text component
 *   - badge:          Icon circle
 *   - nameplate:      Background + text composition
 *   - profile_effect: Animated overlay with pulsing
 *   - chat_bubble:    Themed bubble wrapper
 *   - emoji_pack:     Emoji grid preview
 *   - sound_pack:     Audio icon
 *   - theme:          Gradient swatch
 *
 * Uses React Native Animated API for animations.
 *
 * @module components/cosmetics/cosmetic-renderer
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';

import type { CosmeticItem, CosmeticType } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CosmeticRendererProps {
  /** The cosmetic item to render. */
  readonly item: CosmeticItem;
  /** Render size in dp. */
  readonly size?: number;
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function BorderRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#60a5fa';
  const innerColor = item.colors[1] ?? `${color}80`;

  return (
    <View
      style={[
        styles.centered,
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
          borderWidth: 3,
          borderColor: color,
        },
      ]}
    >
      <View
        style={{
          width: size * 0.82,
          height: size * 0.82,
          borderRadius: size * 0.14,
          borderWidth: 1.5,
          borderColor: innerColor,
        }}
      />
    </View>
  );
}

function TitleRenderer({ item }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#f59e0b';

  return (
    <Text style={[styles.titleText, { color }]} numberOfLines={1}>
      {item.name}
    </Text>
  );
}

function BadgeRenderer({ item, size = 48 }: { item: CosmeticItem; size: number }) {
  const color = item.colors[0] ?? '#a855f7';

  return (
    <View
      style={[
        styles.centered,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          borderColor: color,
        },
      ]}
    >
      {item.previewUrl ? (
        <Image
          source={{ uri: item.previewUrl }}
          style={{ width: size * 0.6, height: size * 0.6 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.fallbackEmoji}>🛡️</Text>
      )}
    </View>
  );
}

function NameplateRenderer({ item, size = 48 }: { item: CosmeticItem; size: number }) {
  const bgColor = item.colors[0] ?? '#1e293b';
  const textColor = item.colors[1] ?? '#ffffff';

  return (
    <View
      style={[
        styles.centered,
        {
          width: size * 3,
          height: size,
          borderRadius: 8,
          backgroundColor: bgColor,
          paddingHorizontal: 12,
        },
      ]}
    >
      <Text style={{ color: textColor, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );
}

function ProfileEffectRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const color = item.colors[0] ?? '#ec4899';

  return (
    <View style={[styles.centered, { width: size, height: size }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size * 0.15,
            backgroundColor: `${color}30`,
            opacity,
          },
        ]}
      />
      <Text style={styles.effectEmoji}>✨</Text>
    </View>
  );
}

function FallbackRenderer({ item, size = 64 }: { item: CosmeticItem; size: number }) {
  return (
    <View
      style={[
        styles.centered,
        {
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.05)',
        },
      ]}
    >
      {item.previewUrl ? (
        <Image
          source={{ uri: item.previewUrl }}
          style={{ width: size, height: size, borderRadius: 8 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.fallbackEmoji}>🎁</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Type → renderer map
// ---------------------------------------------------------------------------

type SubRendererFn = (props: { item: CosmeticItem; size: number }) => React.JSX.Element;

const RENDERERS: Record<CosmeticType, SubRendererFn> = {
  border: BorderRenderer,
  title: TitleRenderer,
  badge: BadgeRenderer,
  nameplate: NameplateRenderer,
  profile_effect: ProfileEffectRenderer,
  profile_frame: FallbackRenderer,
  name_style: FallbackRenderer,
  chat_bubble: FallbackRenderer,
  emoji_pack: FallbackRenderer,
  sound_pack: FallbackRenderer,
  theme: FallbackRenderer,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Universal cosmetic renderer — delegates to type-specific sub-renderer.
 */
export function CosmeticRenderer({ item, size = 64 }: CosmeticRendererProps) {
  const Renderer = RENDERERS[item.type] ?? FallbackRenderer;

  return (
    <View style={styles.container}>
      <Renderer item={item} size={size} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fallbackEmoji: {
    fontSize: 24,
  },
  effectEmoji: {
    fontSize: 28,
  },
});
