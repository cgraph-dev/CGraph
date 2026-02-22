import { ensureArray, isRecord } from '@/lib/apiUtils';
import type { UserBadge, ExtendedProfile } from './profileStore.types';

/**
 * Maps a raw API response object to an ExtendedProfile.
 */
export function mapProfileFromApi(data: Record<string, unknown>): ExtendedProfile {
  const user: Record<string, unknown> = isRecord(data.user) ? data.user : data;
  const currentTitleObj: Record<string, unknown> | null = isRecord(user.current_title)
    ? user.current_title
    : null;
  return {
    id: user.id as string,
    username: user.username as string,
    displayName: (user.display_name as string) || null,
    avatarUrl: (user.avatar_url as string) || null,
    bannerUrl: (user.banner_url as string) || null,
    bio: (user.bio as string) || null,

    signature: {
      enabled: (user.signature_enabled as boolean) || false,
      content: (user.signature as string) || '',
      maxLength: (user.signature_max_length as number) || 500,
    },

    location: (user.location as string) || null,
    website: (user.website as string) || null,
    occupation: (user.occupation as string) || null,
    interests: (user.interests as string) || null,
    birthDate: (user.birth_date as string) || null,
    showBirthDate: (user.show_birth_date as boolean) || false,
    gender: (user.gender as string) || null,

    socialLinks: {
      twitter: (user.twitter as string) || undefined,
      github: (user.github as string) || undefined,
      discord: (user.discord as string) || undefined,
      youtube: (user.youtube as string) || undefined,
      twitch: (user.twitch as string) || undefined,
      instagram: (user.instagram as string) || undefined,
      linkedin: (user.linkedin as string) || undefined,
    },

    customFields: ensureArray(user.custom_fields, 'custom_fields'),

    currentTitle: currentTitleObj
      ? {
          id: String(currentTitleObj.id ?? ''),
          name: String(currentTitleObj.name ?? ''),
          color: String(currentTitleObj.color ?? ''),
          type: (currentTitleObj.type as 'system' | 'custom' | 'earned') || 'system', // safe downcast
        }
      : null,

    availableTitles: (
      ensureArray(user.available_titles, 'available_titles') as Record<string, unknown>[]
    ).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) || '#ffffff',
      type: (t.type as 'system' | 'custom' | 'earned') || 'system', // safe downcast
    })),

    badges: (ensureArray(user.badges, 'badges') as Record<string, unknown>[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: (b.description as string) || '',
      iconUrl: (b.icon_url as string) || '',
      color: (b.color as string) || '#6366f1',
      rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast
      earnedAt: (b.earned_at as string) || new Date().toISOString(),
      isEquipped: (b.is_equipped as boolean) || false,
    })),

    equippedBadges: (
      ensureArray(user.equipped_badges, 'equipped_badges') as Record<string, unknown>[]
    ).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: (b.description as string) || '',
      iconUrl: (b.icon_url as string) || '',
      color: (b.color as string) || '#6366f1',
      rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast
      earnedAt: (b.earned_at as string) || new Date().toISOString(),
      isEquipped: true as const,
    })),

    stars: {
      count: Math.min(5, Math.floor(((user.post_count as number) || 0) / 100) + 1),
      color: '#fbbf24',
    },

    isProfilePrivate: (user.is_profile_private as boolean) || false,
    showOnlineStatus: (user.show_online_status as boolean) ?? true,
    showLastActive: (user.show_last_active as boolean) ?? true,
    showEmail: (user.show_email as boolean) || false,
    showLocation: (user.show_location as boolean) ?? true,

    postCount: (user.post_count as number) || (user.total_posts_created as number) || 0,
    topicCount: (user.topic_count as number) || 0,
    commentCount: (user.comment_count as number) || 0,
    reputation: (user.karma as number) || (user.reputation as number) || 0,
    reputationPositive: (user.reputation_positive as number) || 0,
    reputationNegative: (user.reputation_negative as number) || 0,
    warnLevel: (user.warn_level as number) || 0,

    registeredAt:
      (user.inserted_at as string) || (user.registered_at as string) || new Date().toISOString(),
    lastActive: (user.last_active_at as string) || (user.last_seen_at as string) || null,
    lastPostAt: (user.last_post_at as string) || null,

    isOnline: (user.is_online as boolean) || user.status === 'online',
    status: (user.status as ExtendedProfile['status']) || 'offline', // safe downcast
    statusMessage: (user.status_message as string) || (user.custom_status as string) || null,

    isFriend: (user.is_friend as boolean) || false,
    isBlocked: (user.is_blocked as boolean) || false,
    friendshipStatus: (user.friendship_status as ExtendedProfile['friendshipStatus']) || 'none', // safe downcast
  };
}
