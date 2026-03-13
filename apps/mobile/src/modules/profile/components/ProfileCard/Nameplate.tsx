/* eslint-disable check-file/filename-naming-convention, @typescript-eslint/consistent-type-assertions */
/**
 * Nameplate — decorative Lottie bar behind the username text.
 *
 * Renders a Lottie animation as a horizontal background bar
 * with the username text layered on top in the registry's textColor.
 *
 * Sizes:
 * - 'sm' (180×32): chat messages
 * - 'md' (240×40): profile card
 * - 'lg' (300×48): picker preview / profile page
 *
 * @module profile/components/ProfileCard/Nameplate
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { getNameplateById } from '@cgraph/animation-constants/src/registries/nameplates';
import { getNameplateLottieSource } from '../../../../assets/lottie/nameplates/nameplateMap';

/** Badge data shape */
interface Badge {
  id: string;
  name: string;
  imageUrl: string;
}

/** Size presets for the nameplate bar */
type NameplateSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<NameplateSize, { width: number; height: number; fontSize: number }> = {
  sm: { width: 180, height: 32, fontSize: 13 },
  md: { width: 240, height: 40, fontSize: 16 },
  lg: { width: 300, height: 48, fontSize: 18 },
};

interface NameplateProps {
  /** User ID (kept for data tracking / analytics) */
  userId?: string;
  /** Display name to render */
  displayName: string;
  /** Nameplate ID from the registry */
  nameplateId?: string | null;
  /** Size preset */
  size?: NameplateSize;
  /** Whether Lottie should autoPlay (false in chat lists for perf) */
  autoPlay?: boolean;
  /** Badges to show after the name */
  badges?: Badge[];
  /** Optional accent color tint from profile theme (rendered as semi-transparent overlay) */
  accentTint?: string;
}

/**
 * Decorative username nameplate with Lottie background.
 *
 * If nameplateId is null/undefined or 'plate_none', renders plain text.
 * Otherwise renders the Lottie bar behind the text.
 */
export function Nameplate({
  displayName,
  nameplateId,
  size = 'md',
  autoPlay = true,
  badges,
  accentTint,
}: NameplateProps) {
  const dims = SIZE_MAP[size];
  const entry = nameplateId ? getNameplateById(nameplateId) : undefined;
  const source = getNameplateLottieSource(nameplateId ?? null);
  const textColor = entry?.textColor ?? '#ffffff';

  // No nameplate — plain text
  if (!entry || !source) {
    return (
      <View style={styles.container}>
        <Text
          style={[styles.name, { fontSize: dims.fontSize, color: '#ffffff' }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {badges && badges.length > 0 && <BadgesRow badges={badges} />}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: dims.width, height: dims.height }]}>
      {/* Lottie background bar */}
      <LottieView
        source={source as LottieView['props']['source']}
        style={[styles.lottieBar, { width: dims.width, height: dims.height }]}
        autoPlay={autoPlay}
        loop
        speed={1.0}
        renderMode="AUTOMATIC"
      />

      {/* Optional accent tint overlay from profile theme */}
      {accentTint ? (
        <View
          style={[
            styles.lottieBar,
            { width: dims.width, height: dims.height, backgroundColor: `${accentTint}33` },
          ]}
          pointerEvents="none"
        />
      ) : null}

      {/* Text + badges on top */}
      <View style={styles.textLayer}>
        <Text
          style={[styles.name, { fontSize: dims.fontSize, color: textColor }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {badges && badges.length > 0 && <BadgesRow badges={badges} />}
      </View>
    </View>
  );
}

/** Small row of badge icons */
function BadgesRow({ badges }: { badges: Badge[] }) {
  return (
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
  );
}

/**
 * Legacy NAMEPLATE_STYLES export for backward compatibility.
 * New code should use getNameplateById() from the registry instead.
 */
const NAMEPLATE_STYLES: Record<
  string,
  { color: string; fontStyle?: 'normal' | 'italic'; shadowColor?: string; shadowRadius?: number }
> = {
  default: { color: '#ffffff' },
};

export { NAMEPLATE_STYLES };
export type { Badge };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
  lottieBar: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textLayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  name: {
    fontWeight: '700',
    flexShrink: 1,
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
