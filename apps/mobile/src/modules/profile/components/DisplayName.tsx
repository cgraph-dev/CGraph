/* eslint-disable check-file/filename-naming-convention, @typescript-eslint/consistent-type-assertions */
/**
 * DisplayName — stylized username text with font, effect, and color.
 *
 * Effects:
 * - solid: plain colored text
 * - gradient: LinearGradient + MaskedView for gradient text
 * - neon: multi-layer text shadows for glow
 * - toon: offset black text behind for cartoon stroke
 * - pop: 2px offset darker duplicate for funky shadow
 *
 * @module profile/components/DisplayName
 */

import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  NAME_FONTS,
  type NameFont,
  type NameEffect,
} from '@cgraph/animation-constants/src/registries/displayNameStyles';

// ─── Props ───────────────────────────────────────────────────────────────────

interface DisplayNameProps {
  /** The display name text */
  name: string;
  /** Font style key */
  font: NameFont;
  /** Text effect key */
  effect: NameEffect;
  /** Primary color */
  color: string;
  /** Secondary color (used for gradient end) */
  secondaryColor?: string;
  /** Font size (default 18) */
  size?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build base font style from the registry */
function buildFontStyle(font: NameFont, size: number): TextStyle {
  const config = NAME_FONTS[font];
  return {
    fontSize: size,
    fontWeight: (config.fontWeight as TextStyle['fontWeight']) ?? '600',
    fontFamily: config.fontFamily,
    fontStyle: config.fontStyle ?? 'normal',
    letterSpacing: config.letterSpacing ?? 0,
  };
}

/** Darken a hex color by a factor (0–1) */
function darkenColor(hex: string, factor: number): string {
  const cleaned = hex.replace('#', '');
  const num = parseInt(
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned,
    16
  );
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - factor)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - factor)));
  const b = Math.max(0, Math.round((num & 255) * (1 - factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─── Effect renderers ────────────────────────────────────────────────────────

/** Solid — plain colored text */
function SolidText({
  name,
  fontStyle,
  color,
}: {
  name: string;
  fontStyle: TextStyle;
  color: string;
}) {
  return (
    <Text style={[fontStyle, { color }]} numberOfLines={1}>
      {name}
    </Text>
  );
}

/** Gradient — LinearGradient masked through text */
function GradientText({
  name,
  fontStyle,
  color,
  secondaryColor,
}: {
  name: string;
  fontStyle: TextStyle;
  color: string;
  secondaryColor: string;
}) {
  return (
    <MaskedView
      maskElement={
        <Text style={[fontStyle, { color: '#000' }]} numberOfLines={1}>
          {name}
        </Text>
      }
    >
      <LinearGradient colors={[color, secondaryColor]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {/* Invisible text to size the gradient */}
        <Text style={[fontStyle, { opacity: 0 }]} numberOfLines={1}>
          {name}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

/** Neon — multiple text shadow layers for glow */
function NeonText({
  name,
  fontStyle,
  color,
}: {
  name: string;
  fontStyle: TextStyle;
  color: string;
}) {
  const glowStyle: TextStyle = {
    ...fontStyle,
    color,
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  };

  return (
    <View>
      {/* Background glow layer */}
      <Text
        style={[glowStyle, styles.absoluteText, { textShadowRadius: 20, opacity: 0.6 }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {/* Mid glow layer */}
      <Text
        style={[glowStyle, styles.absoluteText, { textShadowRadius: 12, opacity: 0.8 }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {/* Main text */}
      <Text style={glowStyle} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

/** Toon — offset black text behind for cartoon stroke effect */
function ToonText({
  name,
  fontStyle,
  color,
}: {
  name: string;
  fontStyle: TextStyle;
  color: string;
}) {
  const offsets = [
    { left: -1.5, top: -1.5 },
    { left: 1.5, top: -1.5 },
    { left: -1.5, top: 1.5 },
    { left: 1.5, top: 1.5 },
  ];

  return (
    <View>
      {/* Black stroke layers */}
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[
            fontStyle,
            styles.absoluteText,
            { color: '#000000', left: offset.left, top: offset.top } as ViewStyle & TextStyle,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
      ))}
      {/* Main text on top */}
      <Text style={[fontStyle, { color }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

/** Pop — 2px offset darker duplicate for funky shadow */
function PopText({
  name,
  fontStyle,
  color,
}: {
  name: string;
  fontStyle: TextStyle;
  color: string;
}) {
  const shadowColor = darkenColor(color, 0.4);

  return (
    <View>
      {/* Shadow layer */}
      <Text
        style={[
          fontStyle,
          styles.absoluteText,
          { color: shadowColor, left: 2, top: 2 } as ViewStyle & TextStyle,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {/* Main text */}
      <Text style={[fontStyle, { color }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * Stylized display name with configurable font, effect, and color.
 */
export function DisplayName({
  name,
  font,
  effect,
  color,
  secondaryColor,
  size = 18,
}: DisplayNameProps) {
  const fontStyle = buildFontStyle(font, size);
  const secondary = secondaryColor ?? darkenColor(color, 0.3);

  switch (effect) {
    case 'gradient':
      return (
        <GradientText name={name} fontStyle={fontStyle} color={color} secondaryColor={secondary} />
      );
    case 'neon':
      return <NeonText name={name} fontStyle={fontStyle} color={color} />;
    case 'toon':
      return <ToonText name={name} fontStyle={fontStyle} color={color} />;
    case 'pop':
      return <PopText name={name} fontStyle={fontStyle} color={color} />;
    case 'solid':
    default:
      return <SolidText name={name} fontStyle={fontStyle} color={color} />;
  }
}

export default DisplayName;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  absoluteText: {
    position: 'absolute',
  },
});
