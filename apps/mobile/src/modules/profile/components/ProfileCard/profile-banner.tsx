/**
 * ProfileBanner — background banner for the profile card.
 *
 * Renders a cover image or a theme-based gradient fallback.
 *
 * @module profile/components/ProfileCard/ProfileBanner
 */

import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BORDER_THEME_PALETTES, type BorderTheme } from '@cgraph/animation-constants';

interface ProfileBannerProps {
  /** URL to a banner image */
  bannerUrl?: string;
  /** Theme for gradient fallback */
  theme?: BorderTheme;
  /** Banner width */
  width: number;
  /** Banner height */
  height: number;
}

/**
 * Profile card background banner.
 * Shows a cover image if provided, otherwise a gradient from the theme palette.
 */
export function ProfileBanner({ bannerUrl, theme, width, height }: ProfileBannerProps) {
  if (bannerUrl) {
    return (
      <Image
        source={{ uri: bannerUrl }}
        style={[
          styles.banner,
          {
            width,
            height,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          },
        ]}
        resizeMode="cover"
      />
    );
  }

  const palette = BORDER_THEME_PALETTES[theme ?? 'COSMIC'];
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const colors = [palette[0], palette[1] ?? palette[0]] as [string, string];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.banner,
        {
          width,
          height,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
