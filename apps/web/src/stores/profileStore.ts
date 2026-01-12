import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

/**
 * User Profile Store
 * 
 * Manages user profile data including:
 * - User signature (appended to all posts)
 * - Profile fields (custom fields like website, social links, etc.)
 * - User badges and titles
 * - Profile visibility settings
 * - User stats (posts, topics, reputation, etc.)
 * - Ignore/block list
 * - Profile customization (theme, colors, etc.)
 */

// MyBB-style user signature
export interface UserSignature {
  enabled: boolean;
  content: string; // BBCode/HTML signature
  maxLength: number;
}

// Custom profile field
export interface ProfileField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'url' | 'date';
  value: string | null;
  options?: string[]; // For select type
  required?: boolean;
  editable?: boolean;
  visible?: boolean; // Show on profile
}

// User badge (achievement/role badge)
export interface UserBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  earnedAt: string;
  isEquipped: boolean;
}

// User title (rank/title shown below name)
export interface UserTitle {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'custom' | 'earned'; // System = role-based, Custom = user-set, Earned = achievement
  requiresApproval?: boolean;
}

// User star rating (visual indicator based on post count)
export interface UserStars {
  count: number; // Number of stars (1-5)
  color: string;
  image?: string; // Custom star image URL
}

// Extended user profile data
export interface ExtendedProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  signature: UserSignature;
  
  // Profile fields
  location: string | null;
  website: string | null;
  occupation: string | null;
  interests: string | null;
  birthDate: string | null;
  showBirthDate: boolean;
  gender: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
    youtube?: string;
    twitch?: string;
    instagram?: string;
    linkedin?: string;
  };
  customFields: ProfileField[];
  
  // Title & badges
  currentTitle: UserTitle | null;
  availableTitles: UserTitle[];
  badges: UserBadge[];
  equippedBadges: UserBadge[];
  stars: UserStars;
  
  // Privacy settings
  isProfilePrivate: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showEmail: boolean;
  showLocation: boolean;
  
  // Stats
  postCount: number;
  topicCount: number;
  commentCount: number;
  reputation: number;
  reputationPositive: number;
  reputationNegative: number;
  warnLevel: number; // 0-100%
  
  // Dates
  registeredAt: string;
  lastActive: string | null;
  lastPostAt: string | null;
  
  // Status
  isOnline: boolean;
  status: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
  statusMessage: string | null;
  
  // Relationships
  isFriend: boolean;
  isBlocked: boolean;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

// User in ignore/block list
export interface BlockedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
  reason?: string;
}

// Profile update data
export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  occupation?: string;
  interests?: string;
  birthDate?: string;
  showBirthDate?: boolean;
  gender?: string;
  socialLinks?: ExtendedProfile['socialLinks'];
  customFields?: { fieldId: string; value: string }[];
}

// Signature update data
export interface UpdateSignatureData {
  enabled: boolean;
  content: string;
}

// Privacy settings update
export interface UpdatePrivacySettings {
  isProfilePrivate?: boolean;
  showOnlineStatus?: boolean;
  showLastActive?: boolean;
  showEmail?: boolean;
  showLocation?: boolean;
}

interface ProfileState {
  // Current profile being viewed
  currentProfile: ExtendedProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  
  // Own profile data
  myProfile: ExtendedProfile | null;
  mySignature: UserSignature | null;
  
  // Block/ignore list
  blockedUsers: BlockedUser[];
  isLoadingBlocked: boolean;
  
  // Available profile fields (admin-defined)
  availableFields: ProfileField[];
  
  // Actions
  fetchProfile: (userId: string) => Promise<ExtendedProfile>;
  fetchMyProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updateSignature: (data: UpdateSignatureData) => Promise<void>;
  updatePrivacySettings: (data: UpdatePrivacySettings) => Promise<void>;
  
  // Title & badges
  equipTitle: (titleId: string | null) => Promise<void>;
  equipBadge: (badgeId: string) => Promise<void>;
  unequipBadge: (badgeId: string) => Promise<void>;
  
  // Block/ignore
  fetchBlockedUsers: () => Promise<void>;
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  
  // Avatar/banner upload
  uploadAvatar: (file: File) => Promise<string>;
  uploadBanner: (file: File) => Promise<string>;
  
  // Profile fields
  fetchProfileFields: () => Promise<void>;
  
  // Clear state
  clearProfile: () => void;
}

// Helper to map API response to ExtendedProfile
function mapProfileFromApi(data: Record<string, unknown>): ExtendedProfile {
  const user = (data.user || data) as Record<string, unknown>;
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
    
    currentTitle: user.current_title ? {
      id: (user.current_title as Record<string, unknown>).id as string,
      name: (user.current_title as Record<string, unknown>).name as string,
      color: (user.current_title as Record<string, unknown>).color as string,
      type: ((user.current_title as Record<string, unknown>).type as 'system' | 'custom' | 'earned') || 'system',
    } : null,
    
    availableTitles: (ensureArray(user.available_titles, 'available_titles') as Record<string, unknown>[]).map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) || '#ffffff',
      type: (t.type as 'system' | 'custom' | 'earned') || 'system',
    })),
    
    badges: (ensureArray(user.badges, 'badges') as Record<string, unknown>[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: (b.description as string) || '',
      iconUrl: (b.icon_url as string) || '',
      color: (b.color as string) || '#6366f1',
      rarity: (b.rarity as UserBadge['rarity']) || 'common',
      earnedAt: (b.earned_at as string) || new Date().toISOString(),
      isEquipped: (b.is_equipped as boolean) || false,
    })),
    
    equippedBadges: (ensureArray(user.equipped_badges, 'equipped_badges') as Record<string, unknown>[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: (b.description as string) || '',
      iconUrl: (b.icon_url as string) || '',
      color: (b.color as string) || '#6366f1',
      rarity: (b.rarity as UserBadge['rarity']) || 'common',
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
    
    registeredAt: (user.inserted_at as string) || (user.registered_at as string) || new Date().toISOString(),
    lastActive: (user.last_active_at as string) || (user.last_seen_at as string) || null,
    lastPostAt: (user.last_post_at as string) || null,
    
    isOnline: (user.is_online as boolean) || (user.status === 'online'),
    status: (user.status as ExtendedProfile['status']) || 'offline',
    statusMessage: (user.status_message as string) || (user.custom_status as string) || null,
    
    isFriend: (user.is_friend as boolean) || false,
    isBlocked: (user.is_blocked as boolean) || false,
    friendshipStatus: (user.friendship_status as ExtendedProfile['friendshipStatus']) || 'none',
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentProfile: null,
  isLoadingProfile: false,
  profileError: null,
  myProfile: null,
  mySignature: null,
  blockedUsers: [],
  isLoadingBlocked: false,
  availableFields: [],

  fetchProfile: async (userId: string) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      const profile = mapProfileFromApi(response.data);
      set({ currentProfile: profile, isLoadingProfile: false });
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      set({ profileError: message, isLoadingProfile: false });
      throw error;
    }
  },

  fetchMyProfile: async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile, mySignature: profile.signature });
    } catch (error) {
      console.error('[profileStore] Failed to fetch my profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    try {
      const payload: Record<string, unknown> = {};
      
      if (data.displayName !== undefined) payload.display_name = data.displayName;
      if (data.bio !== undefined) payload.bio = data.bio;
      if (data.location !== undefined) payload.location = data.location;
      if (data.website !== undefined) payload.website = data.website;
      if (data.occupation !== undefined) payload.occupation = data.occupation;
      if (data.interests !== undefined) payload.interests = data.interests;
      if (data.birthDate !== undefined) payload.birth_date = data.birthDate;
      if (data.showBirthDate !== undefined) payload.show_birth_date = data.showBirthDate;
      if (data.gender !== undefined) payload.gender = data.gender;
      if (data.socialLinks !== undefined) {
        payload.twitter = data.socialLinks.twitter;
        payload.github = data.socialLinks.github;
        payload.discord = data.socialLinks.discord;
        payload.youtube = data.socialLinks.youtube;
        payload.twitch = data.socialLinks.twitch;
        payload.instagram = data.socialLinks.instagram;
        payload.linkedin = data.socialLinks.linkedin;
      }
      if (data.customFields !== undefined) {
        payload.custom_fields = data.customFields.map(f => ({
          field_id: f.fieldId,
          value: f.value,
        }));
      }

      const response = await api.put('/api/v1/users/me', { user: payload });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      console.error('[profileStore] Failed to update profile:', error);
      throw error;
    }
  },

  updateSignature: async (data: UpdateSignatureData) => {
    try {
      const response = await api.put('/api/v1/users/me/signature', {
        signature: {
          enabled: data.enabled,
          content: data.content,
        },
      });
      const signature: UserSignature = {
        enabled: response.data.enabled,
        content: response.data.content,
        maxLength: response.data.max_length || 500,
      };
      set((state) => ({
        mySignature: signature,
        myProfile: state.myProfile ? { ...state.myProfile, signature } : null,
      }));
    } catch (error) {
      console.error('[profileStore] Failed to update signature:', error);
      throw error;
    }
  },

  updatePrivacySettings: async (data: UpdatePrivacySettings) => {
    try {
      const payload: Record<string, unknown> = {};
      if (data.isProfilePrivate !== undefined) payload.is_profile_private = data.isProfilePrivate;
      if (data.showOnlineStatus !== undefined) payload.show_online_status = data.showOnlineStatus;
      if (data.showLastActive !== undefined) payload.show_last_active = data.showLastActive;
      if (data.showEmail !== undefined) payload.show_email = data.showEmail;
      if (data.showLocation !== undefined) payload.show_location = data.showLocation;

      const response = await api.put('/api/v1/users/me/privacy', { privacy: payload });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      console.error('[profileStore] Failed to update privacy settings:', error);
      throw error;
    }
  },

  equipTitle: async (titleId: string | null) => {
    try {
      const response = await api.put('/api/v1/users/me/title', {
        title_id: titleId,
      });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      console.error('[profileStore] Failed to equip title:', error);
      throw error;
    }
  },

  equipBadge: async (badgeId: string) => {
    try {
      const response = await api.post('/api/v1/users/me/badges/equip', {
        badge_id: badgeId,
      });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      console.error('[profileStore] Failed to equip badge:', error);
      throw error;
    }
  },

  unequipBadge: async (badgeId: string) => {
    try {
      const response = await api.delete(`/api/v1/users/me/badges/equip/${badgeId}`);
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      console.error('[profileStore] Failed to unequip badge:', error);
      throw error;
    }
  },

  fetchBlockedUsers: async () => {
    set({ isLoadingBlocked: true });
    try {
      const response = await api.get('/api/v1/users/me/blocked');
      const blockedUsers = (ensureArray(response.data, 'blocked') as Record<string, unknown>[]).map((u) => ({
        id: u.id as string,
        username: u.username as string,
        displayName: (u.display_name as string) || null,
        avatarUrl: (u.avatar_url as string) || null,
        blockedAt: u.blocked_at as string,
        reason: (u.reason as string) || undefined,
      }));
      set({ blockedUsers, isLoadingBlocked: false });
    } catch (error) {
      console.error('[profileStore] Failed to fetch blocked users:', error);
      set({ isLoadingBlocked: false });
      throw error;
    }
  },
  blockUser: async (userId: string, reason?: string) => {
    try {
      await api.post('/api/v1/users/me/blocked', {
        user_id: userId,
        reason,
      });
      // Refresh blocked list
      await get().fetchBlockedUsers();
      // Update current profile if viewing blocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({ currentProfile: { ...current, isBlocked: true } });
      }
    } catch (error) {
      console.error('[profileStore] Failed to block user:', error);
      throw error;
    }
  },

  unblockUser: async (userId: string) => {
    try {
      await api.delete(`/api/v1/users/me/blocked/${userId}`);
      set((state) => ({
        blockedUsers: state.blockedUsers.filter(u => u.id !== userId),
      }));
      // Update current profile if viewing unblocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({ currentProfile: { ...current, isBlocked: false } });
      }
    } catch (error) {
      console.error('[profileStore] Failed to unblock user:', error);
      throw error;
    }
  },

  isUserBlocked: (userId: string) => {
    return get().blockedUsers.some(u => u.id === userId);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/v1/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    const avatarUrl = response.data.avatar_url || response.data.url;
    
    set((state) => ({
      myProfile: state.myProfile ? { ...state.myProfile, avatarUrl } : null,
    }));
    
    return avatarUrl;
  },

  uploadBanner: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/v1/users/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    const bannerUrl = response.data.banner_url || response.data.url;
    
    set((state) => ({
      myProfile: state.myProfile ? { ...state.myProfile, bannerUrl } : null,
    }));
    
    return bannerUrl;
  },

  fetchProfileFields: async () => {
    try {
      const response = await api.get('/api/v1/profile-fields');
      const fields = (ensureArray(response.data, 'fields') as Record<string, unknown>[]).map((f) => ({
        id: f.id as string,
        name: f.name as string,
        type: (f.type as ProfileField['type']) || 'text',
        value: null,
        options: f.options as string[] | undefined,
        required: (f.required as boolean) || false,
        editable: (f.editable as boolean) ?? true,
        visible: (f.visible as boolean) ?? true,
      }));
      set({ availableFields: fields });
    } catch (error) {
      console.error('[profileStore] Failed to fetch profile fields:', error);
    }
  },

  clearProfile: () => {
    set({
      currentProfile: null,
      profileError: null,
    });
  },
}));

export default useProfileStore;
