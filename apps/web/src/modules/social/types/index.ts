/**
 * Social Module Types
 *
 * Type definitions for social features including friends, followers, and activities.
 *
 * @module modules/social/types
 * @version 1.0.0
 */

/**
 * Friendship status
 */
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

/**
 * Online status
 */
export type OnlineStatus = 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';

/**
 * Activity type
 */
export type ActivityType =
  | 'playing'
  | 'streaming'
  | 'listening'
  | 'watching'
  | 'competing'
  | 'custom';

/**
 * Relationship type
 */
export type RelationshipType = 'friend' | 'follower' | 'following' | 'blocked';

/**
 * Friend request
 */
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  createdAt: string;
  respondedAt?: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

/**
 * User profile (basic)
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarBorder?: string;
  banner?: string;
  bio?: string;
  status: OnlineStatus;
  customStatus?: string;
  activity?: UserActivity;
  level: number;
  xp: number;
  badges: string[];
  createdAt: string;
  lastSeen?: string;
}

/**
 * Extended user profile
 */
export interface ExtendedUserProfile extends UserProfile {
  pronouns?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLink[];
  mutualFriendsCount: number;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  groupsCount: number;
  friendshipStatus: FriendshipStatus;
  isFollowing: boolean;
  isBlocked: boolean;
}

/**
 * Social link
 */
export interface SocialLink {
  platform:
    | 'twitter'
    | 'instagram'
    | 'github'
    | 'linkedin'
    | 'discord'
    | 'youtube'
    | 'twitch'
    | 'other';
  url: string;
  verified: boolean;
}

/**
 * User activity
 */
export interface UserActivity {
  type: ActivityType;
  name: string;
  details?: string;
  state?: string;
  startedAt: string;
  endsAt?: string;
  imageUrl?: string;
  url?: string;
  applicationId?: string;
}

/**
 * Presence update
 */
export interface PresenceUpdate {
  userId: string;
  status: OnlineStatus;
  customStatus?: string;
  activity?: UserActivity;
  updatedAt: string;
}

/**
 * Friend
 */
export interface Friend {
  id: string;
  user: UserProfile;
  nickname?: string;
  since: string;
  favorited: boolean;
}

/**
 * Follower/Following
 */
export interface Follow {
  id: string;
  user: UserProfile;
  followedAt: string;
  notifications: boolean;
}

/**
 * Block
 */
export interface Block {
  id: string;
  blockedUser: UserProfile;
  blockedAt: string;
  reason?: string;
}

/**
 * Feed item type
 */
export type FeedItemType =
  | 'post'
  | 'achievement'
  | 'level_up'
  | 'badge_earned'
  | 'friend_added'
  | 'group_joined'
  | 'status_update';

/**
 * Feed item
 */
export interface FeedItem {
  id: string;
  type: FeedItemType;
  userId: string;
  user: UserProfile;
  content?: string;
  metadata: Record<string, unknown>;
  attachments?: FeedAttachment[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  visibility: 'public' | 'friends' | 'private';
  createdAt: string;
}

/**
 * Feed attachment
 */
export interface FeedAttachment {
  id: string;
  type: 'image' | 'video' | 'link' | 'poll';
  url?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Feed comment
 */
export interface FeedComment {
  id: string;
  feedItemId: string;
  userId: string;
  user: UserProfile;
  content: string;
  likes: number;
  isLiked: boolean;
  parentId?: string;
  replies?: FeedComment[];
  createdAt: string;
  editedAt?: string;
}

/**
 * Mention
 */
export interface Mention {
  id: string;
  mentionerId: string;
  mentioner: UserProfile;
  contextType: 'post' | 'comment' | 'message' | 'thread';
  contextId: string;
  excerpt: string;
  read: boolean;
  createdAt: string;
}

/**
 * User suggestion
 */
export interface UserSuggestion {
  user: UserProfile;
  reason: 'mutual_friends' | 'similar_interests' | 'same_groups' | 'popular';
  mutualFriendsCount?: number;
  score: number;
}

/**
 * Social stats
 */
export interface SocialStats {
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  blockedCount: number;
  pendingRequestsCount: number;
  mutualFriendsWithUser?: number;
}

/**
 * Relationship
 */
export interface Relationship {
  userId: string;
  targetUserId: string;
  type: RelationshipType;
  nickname?: string;
  createdAt: string;
}

/**
 * Status update
 */
export interface StatusUpdate {
  status: OnlineStatus;
  customStatus?: string;
  expiresAt?: string;
}
