/**
 * Mappers for transforming API profile response data.
 * @module modules/social/store/profile-mappers
 */
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: user.id as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    username: user.username as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    displayName: (user.display_name as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    avatarUrl: (user.avatar_url as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    bannerUrl: (user.banner_url as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    bio: (user.bio as string) || null, // type assertion: API response field

    signature: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      enabled: (user.signature_enabled as boolean) || false, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      content: (user.signature as string) || '', // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      maxLength: (user.signature_max_length as number) || 500, // type assertion: API response field
    },

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    location: (user.location as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    website: (user.website as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    occupation: (user.occupation as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    interests: (user.interests as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    birthDate: (user.birth_date as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    showBirthDate: (user.show_birth_date as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    gender: (user.gender as string) || null, // type assertion: API response field

    socialLinks: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      twitter: (user.twitter as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      github: (user.github as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      discord: (user.discord as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      youtube: (user.youtube as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      twitch: (user.twitch as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      instagram: (user.instagram as string) || undefined, // type assertion: API response field

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      linkedin: (user.linkedin as string) || undefined, // type assertion: API response field
    },

    customFields: ensureArray(user.custom_fields, 'custom_fields'),

    currentTitle: currentTitleObj
      ? {
          id: String(currentTitleObj.id ?? ''),
          name: String(currentTitleObj.name ?? ''),
          color: String(currentTitleObj.color ?? ''),

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          type: (currentTitleObj.type as 'system' | 'custom' | 'earned') || 'system', // safe downcast
        }
      : null,

    availableTitles: ensureArray(user.available_titles, 'available_titles')
      .filter(isRecord)
      .map((t) => ({
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        id: t.id as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: t.name as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        color: (t.color as string) || '#ffffff', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        type: (t.type as 'system' | 'custom' | 'earned') || 'system', // safe downcast
      })),

    badges: ensureArray(user.badges, 'badges')
      .filter(isRecord)
      .map((b) => ({
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        id: b.id as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: b.name as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        description: (b.description as string) || '', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        iconUrl: (b.icon_url as string) || '', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        color: (b.color as string) || '#6366f1', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        earnedAt: (b.earned_at as string) || new Date().toISOString(), // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        isEquipped: (b.is_equipped as boolean) || false, // type assertion: API response field
      })),

    equippedBadges: ensureArray(user.equipped_badges, 'equipped_badges')
      .filter(isRecord)
      .map((b) => ({
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        id: b.id as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: b.name as string, // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        description: (b.description as string) || '', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        iconUrl: (b.icon_url as string) || '', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        color: (b.color as string) || '#6366f1', // type assertion: API response field

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        earnedAt: (b.earned_at as string) || new Date().toISOString(), // type assertion: API response field
        isEquipped: true as const,
      })),

    stars: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      count: Math.min(5, Math.floor(((user.post_count as number) || 0) / 100) + 1), // type assertion: API response field
      color: '#fbbf24',
    },

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isProfilePrivate: (user.is_profile_private as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    showOnlineStatus: (user.show_online_status as boolean) ?? true, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    showLastActive: (user.show_last_active as boolean) ?? true, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    showEmail: (user.show_email as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    showLocation: (user.show_location as boolean) ?? true, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    postCount: (user.post_count as number) || (user.total_posts_created as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    topicCount: (user.topic_count as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    commentCount: (user.comment_count as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    reputation: (user.karma as number) || (user.reputation as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    reputationPositive: (user.reputation_positive as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    reputationNegative: (user.reputation_negative as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    warnLevel: (user.warn_level as number) || 0, // type assertion: API response field

    registeredAt:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (user.inserted_at as string) || (user.registered_at as string) || new Date().toISOString(), // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    lastActive: (user.last_active_at as string) || (user.last_seen_at as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    lastPostAt: (user.last_post_at as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isOnline: (user.is_online as boolean) || user.status === 'online', // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    status: (user.status as ExtendedProfile['status']) || 'offline', // safe downcast

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    statusMessage: (user.status_message as string) || (user.custom_status as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isFriend: (user.is_friend as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isBlocked: (user.is_blocked as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    friendshipStatus: (user.friendship_status as ExtendedProfile['friendshipStatus']) || 'none', // safe downcast
  };
}
