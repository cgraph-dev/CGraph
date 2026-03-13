/**
 * IdentityCard — compact view for forum post headers.
 *
 * Renders avatar with frame, display name, badge row (max 3),
 * title, and reputation pill from a frozen nameplate snapshot.
 *
 * @module components/forums/identity-card
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NameplateSnapshot {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  frame?: { id: string; name: string; color: string; border_width?: number } | null;
  badges?: { id: string; name: string; icon: string; color: string }[];
  title?: string | null;
  reputation?: number;
  nameplate_color?: string;
  bio?: string;
}

interface IdentityCardProps {
  snapshot: NameplateSnapshot;
  /** Compact mode for post headers; full mode shows all details */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BADGES = 3;

const BADGE_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  star: 'star',
  shield: 'shield-checkmark',
  flame: 'flame',
  heart: 'heart',
  trophy: 'trophy',
  diamond: 'diamond',
  ribbon: 'ribbon',
  default: 'medal-outline',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Identity Card component. */
export default function IdentityCard({ snapshot, compact = true }: IdentityCardProps) {
  const displayName = snapshot.display_name || snapshot.username || 'Anonymous';
  const badges = (snapshot.badges || []).slice(0, MAX_BADGES);
  const frameColor = snapshot.frame?.color || 'transparent';
  const frameBorder = snapshot.frame?.border_width || 2;

  return (
    <View style={[styles.container, !compact && styles.containerFull]}>
      {/* Avatar with frame */}
      <View
        style={[
          styles.avatarFrame,
          {
            borderColor: frameColor,
            borderWidth: snapshot.frame ? frameBorder : 0,
          },
        ]}
      >
        {snapshot.avatar_url ? (
          <Image source={{ uri: snapshot.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Info column */}
      <View style={styles.infoColumn}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.displayName,
              snapshot.nameplate_color ? { color: snapshot.nameplate_color } : null,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </View>

        {/* Badge row */}
        {badges.length > 0 && (
          <View style={styles.badgeRow}>
            {badges.map((badge) => {
              const iconName = BADGE_ICON_MAP[badge.icon] || BADGE_ICON_MAP.default;
              return (
                <View
                  key={badge.id}
                  style={[styles.badge, { backgroundColor: badge.color + '20' }]}
                >
                  <Ionicons name={iconName} size={10} color={badge.color} />
                  {!compact && (
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.name}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Title */}
        {snapshot.title && (
          <Text style={styles.title} numberOfLines={1}>
            {snapshot.title}
          </Text>
        )}

        {/* Reputation pill */}
        {snapshot.reputation != null && (
          <View style={styles.repPill}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.repText}>{snapshot.reputation.toLocaleString()}</Text>
          </View>
        )}

        {/* Bio — only in full mode */}
        {!compact && snapshot.bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {snapshot.bio}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  containerFull: {
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
  },
  avatarFrame: {
    borderRadius: 22,
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  title: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  repPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  repText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  bio: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginTop: 4,
  },
});
