/**
 * Profile Store Types
 *
 * Type definitions for user profile management including:
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

export interface ProfileState {
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
