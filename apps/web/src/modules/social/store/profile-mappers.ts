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
     
    id: user.id as string, // type assertion: API response field
     
    username: user.username as string, // type assertion: API response field
     
    displayName: (user.display_name as string) || null, // type assertion: API response field
     
    avatarUrl: (user.avatar_url as string) || null, // type assertion: API response field
     
    bannerUrl: (user.banner_url as string) || null, // type assertion: API response field
     
    bio: (user.bio as string) || null, // type assertion: API response field

    signature: {
       
      enabled: (user.signature_enabled as boolean) || false, // type assertion: API response field
       
      content: (user.signature as string) || '', // type assertion: API response field
       
      maxLength: (user.signature_max_length as number) || 500, // type assertion: API response field
    },

     
    location: (user.location as string) || null, // type assertion: API response field
     
    website: (user.website as string) || null, // type assertion: API response field
     
    occupation: (user.occupation as string) || null, // type assertion: API response field
     
    interests: (user.interests as string) || null, // type assertion: API response field
     
    birthDate: (user.birth_date as string) || null, // type assertion: API response field
     
    showBirthDate: (user.show_birth_date as boolean) || false, // type assertion: API response field
     
    gender: (user.gender as string) || null, // type assertion: API response field

    socialLinks: {
       
      twitter: (user.twitter as string) || undefined, // type assertion: API response field
       
      github: (user.github as string) || undefined, // type assertion: API response field
       
      discord: (user.discord as string) || undefined, // type assertion: API response field
       
      youtube: (user.youtube as string) || undefined, // type assertion: API response field
       
      twitch: (user.twitch as string) || undefined, // type assertion: API response field
       
      instagram: (user.instagram as string) || undefined, // type assertion: API response field
       
      linkedin: (user.linkedin as string) || undefined, // type assertion: API response field
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

    availableTitles: ensureArray(user.available_titles, 'available_titles')
      .filter(isRecord)
      .map((t) => ({
         
        id: t.id as string, // type assertion: API response field
         
        name: t.name as string, // type assertion: API response field
         
        color: (t.color as string) || '#ffffff', // type assertion: API response field
         
        type: (t.type as 'system' | 'custom' | 'earned') || 'system', // safe downcast
      })),

    badges: ensureArray(user.badges, 'badges')
      .filter(isRecord)
      .map((b) => ({
         
        id: b.id as string, // type assertion: API response field
         
        name: b.name as string, // type assertion: API response field
         
        description: (b.description as string) || '', // type assertion: API response field
         
        iconUrl: (b.icon_url as string) || '', // type assertion: API response field
         
        color: (b.color as string) || '#6366f1', // type assertion: API response field
         
        rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast
         
        earnedAt: (b.earned_at as string) || new Date().toISOString(), // type assertion: API response field
         
        isEquipped: (b.is_equipped as boolean) || false, // type assertion: API response field
      })),

    equippedBadges: ensureArray(user.equipped_badges, 'equipped_badges')
      .filter(isRecord)
      .map((b) => ({
         
        id: b.id as string, // type assertion: API response field
         
        name: b.name as string, // type assertion: API response field
         
        description: (b.description as string) || '', // type assertion: API response field
         
        iconUrl: (b.icon_url as string) || '', // type assertion: API response field
         
        color: (b.color as string) || '#6366f1', // type assertion: API response field
         
        rarity: (b.rarity as UserBadge['rarity']) || 'common', // safe downcast
         
        earnedAt: (b.earned_at as string) || new Date().toISOString(), // type assertion: API response field
        isEquipped: true as const,
      })),

    stars: {
       
      count: Math.min(5, Math.floor(((user.post_count as number) || 0) / 100) + 1), // type assertion: API response field
      color: '#fbbf24',
    },

     
    isProfilePrivate: (user.is_profile_private as boolean) || false, // type assertion: API response field
     
    showOnlineStatus: (user.show_online_status as boolean) ?? true, // type assertion: API response field
     
    showLastActive: (user.show_last_active as boolean) ?? true, // type assertion: API response field
     
    showEmail: (user.show_email as boolean) || false, // type assertion: API response field
     
    showLocation: (user.show_location as boolean) ?? true, // type assertion: API response field

     
    postCount: (user.post_count as number) || (user.total_posts_created as number) || 0, // type assertion: API response field
     
    topicCount: (user.topic_count as number) || 0, // type assertion: API response field
     
    commentCount: (user.comment_count as number) || 0, // type assertion: API response field
     
    reputation: (user.karma as number) || (user.reputation as number) || 0, // type assertion: API response field
     
    reputationPositive: (user.reputation_positive as number) || 0, // type assertion: API response field
     
    reputationNegative: (user.reputation_negative as number) || 0, // type assertion: API response field
     
    warnLevel: (user.warn_level as number) || 0, // type assertion: API response field

    registeredAt:
       
      (user.inserted_at as string) || (user.registered_at as string) || new Date().toISOString(), // type assertion: API response field
     
    lastActive: (user.last_active_at as string) || (user.last_seen_at as string) || null, // type assertion: API response field
     
    lastPostAt: (user.last_post_at as string) || null, // type assertion: API response field

     
    isOnline: (user.is_online as boolean) || user.status === 'online', // type assertion: API response field
     
    status: (user.status as ExtendedProfile['status']) || 'offline', // safe downcast
     
    statusMessage: (user.status_message as string) || (user.custom_status as string) || null, // type assertion: API response field

     
    isFriend: (user.is_friend as boolean) || false, // type assertion: API response field
     
    isBlocked: (user.is_blocked as boolean) || false, // type assertion: API response field
     
    friendshipStatus: (user.friendship_status as ExtendedProfile['friendshipStatus']) || 'none', // safe downcast
  };
}
