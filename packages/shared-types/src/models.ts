// ============================================
// User & Auth Models
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  bio: string | null;
  status: UserStatus;
  statusMessage: string | null;
  emailVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface Session {
  id: string;
  userId: string;
  deviceType: string;
  deviceName: string | null;
  ipAddress: string;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
}

// ============================================
// Messaging Models
// ============================================

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = 'direct' | 'group';

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: UserBasic;
  nickname: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  joinedAt: string;
}

export interface Message {
  id: string;
  conversationId: string | null;
  channelId: string | null;
  senderId: string;
  sender: UserBasic;
  content: string;
  encryptedContent: string | null;
  messageType: MessageType;
  replyToId: string | null;
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: MessageMetadata;
  reactions: Reaction[];
  createdAt: string;
  updatedAt: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'file'
  | 'audio'
  | 'sticker'
  | 'gif'
  | 'system';

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: UserBasic;
  createdAt: string;
}

export interface ReadReceipt {
  id: string;
  userId: string;
  messageId: string;
  readAt: string;
}

// ============================================
// Group Models
// ============================================

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  onlineMemberCount: number;
  ownerId: string;
  owner: UserBasic;
  categories: ChannelCategory[];
  channels: Channel[];
  roles: Role[];
  myMember: Member | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelCategory {
  id: string;
  groupId: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  groupId: string;
  categoryId: string | null;
  name: string;
  type: ChannelType;
  topic: string | null;
  position: number;
  isNsfw: boolean;
  slowModeSeconds: number;
  unreadCount: number;
  lastMessageAt: string | null;
}

export type ChannelType = 'text' | 'voice' | 'video' | 'announcement' | 'forum';

export interface Role {
  id: string;
  groupId: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  isDefault: boolean;
  isMentionable: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  groupId: string;
  userId: string;
  user: UserBasic;
  nickname: string | null;
  roles: Role[];
  isMuted: boolean;
  mutedUntil: string | null;
  isBanned: boolean;
  joinedAt: string;
}

export interface Invite {
  id: string;
  groupId: string;
  group: GroupBasic;
  code: string;
  creatorId: string;
  creator: UserBasic;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
}

// ============================================
// Forum Models
// ============================================

export interface Forum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  customCss: string | null;
  isNsfw: boolean;
  isPrivate: boolean;
  memberCount: number;
  creatorId: string;
  creator: UserBasic;
  categories: ForumCategory[];
  moderators: UserBasic[];
  isSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumCategory {
  id: string;
  forumId: string;
  name: string;
  color: string;
}

export interface Post {
  id: string;
  forumId: string;
  forum: ForumBasic;
  authorId: string;
  author: UserBasic;
  title: string;
  content: string;
  postType: PostType;
  linkUrl: string | null;
  mediaUrls: string[];
  isPinned: boolean;
  isLocked: boolean;
  isNsfw: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  hotScore: number;
  commentCount: number;
  categoryId: string | null;
  category: ForumCategory | null;
  myVote: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export type PostType = 'text' | 'link' | 'image' | 'video' | 'poll';

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: UserBasic;
  parentId: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  depth: number;
  isCollapsed: boolean;
  myVote: VoteValue;
  children: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  postId: string | null;
  commentId: string | null;
  value: 1 | -1;
  createdAt: string;
}

export type VoteValue = 1 | -1 | null;

// ============================================
// Permission System
// ============================================

export const Permissions = {
  // General
  VIEW_CHANNELS: 1n << 0n,
  MANAGE_CHANNELS: 1n << 1n,
  MANAGE_ROLES: 1n << 2n,
  MANAGE_GROUP: 1n << 3n,
  
  // Membership
  KICK_MEMBERS: 1n << 4n,
  BAN_MEMBERS: 1n << 5n,
  CREATE_INVITES: 1n << 6n,
  CHANGE_NICKNAME: 1n << 7n,
  MANAGE_NICKNAMES: 1n << 8n,
  
  // Text Channels
  SEND_MESSAGES: 1n << 9n,
  EMBED_LINKS: 1n << 10n,
  ATTACH_FILES: 1n << 11n,
  ADD_REACTIONS: 1n << 12n,
  USE_EXTERNAL_EMOJIS: 1n << 13n,
  MENTION_EVERYONE: 1n << 14n,
  MANAGE_MESSAGES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  
  // Voice Channels
  CONNECT: 1n << 17n,
  SPEAK: 1n << 18n,
  VIDEO: 1n << 19n,
  MUTE_MEMBERS: 1n << 20n,
  DEAFEN_MEMBERS: 1n << 21n,
  MOVE_MEMBERS: 1n << 22n,
  
  // Admin
  ADMINISTRATOR: 1n << 31n,
} as const;

export type Permission = keyof typeof Permissions;

// ============================================
// Basic/Minimal Types for Nested Objects
// ============================================

export interface UserBasic {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status?: UserStatus;
}

export interface GroupBasic {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export interface ForumBasic {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export interface ChannelBasic {
  id: string;
  name: string;
  type: ChannelType;
}

// ============================================
// Friendship Models
// ============================================

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
  acceptedAt: string | null;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  statusMessage: string | null;
  friendshipId: string;
  since: string;
}

export interface FriendRequest {
  id: string;
  user: UserBasic;
  type: 'incoming' | 'outgoing';
  mutualFriendsCount?: number;
  createdAt: string;
}

export interface FriendSuggestion {
  user: UserBasic;
  reason: string;
  mutualFriendsCount: number;
  mutualGroupsCount: number;
}

// ============================================
// Forum Hosting Models (MyBB-style)
// ============================================

export interface HostedForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customCss: string | null;
  customHeader: string | null;
  customFooter: string | null;
  isPrivate: boolean;
  isNsfw: boolean;
  requireApproval: boolean;
  ownerId: string;
  owner: UserBasic;
  memberCount: number;
  threadCount: number;
  postCount: number;
  upvotes: number;
  downvotes: number;
  score: number;
  hotScore: number;
  category: ForumHostingCategory;
  isFeatured: boolean;
  boards: Board[];
  myMembership: ForumMembership | null;
  myVote: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export type ForumHostingCategory =
  | 'general'
  | 'gaming'
  | 'technology'
  | 'crypto'
  | 'art'
  | 'music'
  | 'sports'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'other';

export interface Board {
  id: string;
  forumId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  position: number;
  isLocked: boolean;
  threadCount: number;
  postCount: number;
  lastPostAt: string | null;
  lastPostTitle: string | null;
  lastPostAuthor: UserBasic | null;
  children: Board[];
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  boardId: string;
  authorId: string;
  author: UserBasic;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  isAnnouncement: boolean;
  viewCount: number;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  score: number;
  lastReplyAt: string | null;
  lastReplyBy: UserBasic | null;
  myVote: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadPost {
  id: string;
  threadId: string;
  authorId: string;
  author: UserBasic;
  content: string;
  isFirstPost: boolean;
  isEdited: boolean;
  editCount: number;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export interface ForumMembership {
  id: string;
  forumId: string;
  userId: string;
  role: ForumMemberRole;
  title: string | null;
  postCount: number;
  reputation: number;
  isBanned: boolean;
  bannedUntil: string | null;
  joinedAt: string;
}

export type ForumMemberRole = 'member' | 'moderator' | 'admin' | 'owner';
