/**
 * ProfileCard — the main stacked profile card component.
 *
 * 5 independent layers, bottom to top:
 * 1. ProfileBanner (background image/gradient)
 * 2. Avatar + AvatarBorder (border via AvatarBorder component)
 * 3. Nameplate (styled username display)
 * 4. ProfileEffect (full-card overlay, pointerEvents=none)
 * 5. ProfileWidgets (info blocks)
 *
 * @module profile/components/ProfileCard
 */

import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useThemeStore } from '@/stores';
import { getValidImageUrl } from '@/lib/imageUtils';
import { getBorderById, type BorderTheme } from '@cgraph/animation-constants';
import {
  DEFAULT_PROFILE_THEME,
  type ProfileTheme,
} from '@cgraph/animation-constants/src/registries/profileThemes';
// TODO(phase-26): Rewire — gamification components deleted
import { ProfileBanner } from './profile-banner';
import { Nameplate, type Badge } from './nameplate';
import { ProfileEffect } from './profile-effect';
import { ProfileWidgets, type ProfileWidget } from './profile-widgets';

/** User profile data expected by ProfileCard */
interface UserProfileData {
  id: string;
  username: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string;
  status?: string;
  level?: number;
  badges?: Badge[];
}

interface ProfileCardProps {
  /** User profile data */
  user: UserProfileData;
  /** Equipped avatar border ID from BORDER_REGISTRY */
  equippedBorderId?: string;
  /** Equipped nameplate style ID */
  equippedNameplateId?: string;
  /** Equipped profile effect ID */
  equippedProfileEffectId?: string;
  /** Banner image URL */
  equippedBannerUrl?: string;
  /** Theme override for banner gradient */
  bannerTheme?: BorderTheme;
  /** Profile theme colors (primary background + accent) */
  profileTheme?: ProfileTheme;
  /** Profile widgets */
  widgets?: ProfileWidget[];
  /** Preview mode disables animations */
  isPreview?: boolean;
  /** Press handler for the border */
  onPressBorder?: () => void;
  /** Press handler for the avatar */
  onPressAvatar?: () => void;
}

const AVATAR_SIZE = 80;
const BANNER_HEIGHT = 120;

/**
 * Full stacked profile card with animated border, nameplate, effects, and widgets.
 */
export function ProfileCard({
  user,
  equippedBorderId,
  equippedNameplateId,
  equippedProfileEffectId,
  equippedBannerUrl,
  bannerTheme,
  profileTheme,
  widgets = [],
  isPreview = false,
}: ProfileCardProps) {
  const { colors } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - 32, 480);
  const isAnimating = !isPreview;

  // Resolve profile theme
  const themePrimary = profileTheme?.primary ?? DEFAULT_PROFILE_THEME.primary;
  const themeAccent = profileTheme?.accent ?? DEFAULT_PROFILE_THEME.accent;

  // Resolve border entry for rarity/theme
  const borderEntry = equippedBorderId ? getBorderById(equippedBorderId) : undefined;
  const _borderRarity = borderEntry?.rarity ?? 'free';
  const borderTheme = borderEntry?.theme ?? bannerTheme ?? 'COSMIC';

  // Resolve avatar URL
  const avatarUrl = getValidImageUrl(user.avatar_url);
  const displayName = user.display_name || user.username || 'Unknown';

  // Presence color
  const presenceColor = user.status === 'online' ? '#22c55e' : '#6b7280';

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: themePrimary,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Layer 1: Banner */}
      <ProfileBanner
        bannerUrl={equippedBannerUrl}
        theme={bannerTheme ?? borderTheme}
        width={cardWidth}
        height={BANNER_HEIGHT}
      />

      {/* Layer 4: Profile effect overlay */}
      <ProfileEffect
        effectId={equippedProfileEffectId}
        isAnimating={isAnimating}
        width={cardWidth}
        height={BANNER_HEIGHT + 200}
      />

      {/* Content area below banner */}
      <View style={styles.content}>
        {/* Layer 2: Avatar with border */}
        <View style={styles.avatarSection}>
          {/* TODO(phase-26): Rewire AvatarBorder — gamification components deleted */}
          <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : {
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=256`,
                    }
              }
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          {/* Online indicator */}
          <View
            style={[
              styles.presenceDot,
              { backgroundColor: presenceColor, borderColor: colors.surface },
            ]}
          />
        </View>

        {/* Layer 3: Name section */}
        <View style={styles.nameSection}>
          <Nameplate
            userId={user.id}
            displayName={displayName}
            nameplateId={equippedNameplateId}
            badges={user.badges}
            accentTint={themeAccent}
          />

          {user.username && (
            <Text style={[styles.handle, { color: colors.textSecondary }]}>@{user.username}</Text>
          )}

          {user.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>

        {/* Layer 5: Widgets */}
        <View style={styles.widgetsSection}>
          <ProfileWidgets widgets={widgets} />
        </View>
      </View>
    </View>
  );
}

export default ProfileCard;

// Re-export sub-components for direct access
export { ProfileBanner } from './profile-banner';
export { Nameplate, NAMEPLATE_STYLES } from './nameplate';
export { ProfileEffect } from './profile-effect';
export { ProfileWidgets } from './profile-widgets';
export type { ProfileWidget } from './profile-widgets';
export type { Badge } from './nameplate';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    alignSelf: 'center',
  },
  content: {
    paddingTop: BANNER_HEIGHT - AVATAR_SIZE / 2,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  avatarSection: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginTop: -(AVATAR_SIZE / 2 + 8),
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  nameSection: {
    gap: 4,
  },
  handle: {
    fontSize: 14,
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  widgetsSection: {
    marginTop: 4,
  },
});
