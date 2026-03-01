// User types
export interface User {
  id: string;
  email: string;
  username: string | null;
  uid: string; // Random 10-digit UID (e.g., "4829173650")
  user_id: number; // Legacy sequential ID
  user_id_display: string; // Formatted UID (e.g., "#4829173650")
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  wallet_address?: string;
  karma?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  is_profile_private?: boolean;
  username_changed_at?: string;
  can_change_username: boolean;
  username_next_change_at?: string;
  title?: string; // User's custom title badge
  title_rarity?: string; // Rarity tier for the title (common, rare, epic, legendary, mythic, etc.)
  inserted_at: string;
  updated_at: string;
}

// Re-export API response types
export * from './api';

export interface UserBasic {
  id: string;
  username: string | null;
  display_name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  status: string;
  karma?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  /** Allow dynamic API property access at the boundary */
  [key: string]: unknown;
}

// Message types
export interface MessageMetadata {
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
  waveform?: number[];
  // Multi-photo grid support
  grid_images?: string[];
  image_count?: number;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'voice' | 'video' | 'system';
  attachments: Attachment[];
  metadata?: MessageMetadata;
  sender: UserBasic;
  sender_id: string;
  conversation_id?: string;
  channel_id?: string;
  reply_to_id?: string;
  reply_to?: Message;
  reactions: Reaction[];
  is_edited: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  is_pinned?: boolean;
  pinned_at?: string;
  pinned_by_id?: string;
  edits?: EditHistory[];
  inserted_at: string;
  updated_at: string;
  // Message delivery status
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivered_at?: string;
  read_at?: string;
  // E2EE fields
  is_encrypted?: boolean;
  encrypted_content?: string | null;
  decryption_failed?: boolean;
  // For optimistic updates
  is_optimistic?: boolean;
  file_url?: string;
  // Forwarding metadata
  forwarded_from_id?: string | null;
  forwarded_from_user_id?: string | null;
  forwarded_from_user_name?: string | null;
  // Server-side link preview
  link_preview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    type?: string;
    favicon?: string;
  } | null;
  // Disappearing messages
  expires_at?: string | null;
}

export interface EditHistory {
  id: string;
  messageId: string;
  previousContent: string;
  editNumber: number;
  editedById: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  metadata?: Record<string, unknown>;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: UserBasic[];
  hasReacted: boolean;
}

// Conversation participant type (includes nested user object)
export interface ConversationParticipant {
  id: string;
  userId?: string;
  user_id?: string;
  nickname?: string | null;
  isMuted?: boolean;
  is_muted?: boolean;
  joinedAt?: string;
  joined_at?: string;
  user?: UserBasic;
  // Fallback flat fields when user data is flattened
  username?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
}

// Conversation types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
  inserted_at: string;
  updated_at: string;
}

// Group types
export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  owner_id: string;
  is_public: boolean;
  member_count: number;
  categories: ChannelCategory[];
  roles: Role[];
  my_member?: Member;
  inserted_at: string;
  updated_at: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcements' | 'stage';
  topic?: string;
  position: number;
  category_id?: string;
  is_private: boolean;
  unread_count: number;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: number;
  position: number;
  is_default: boolean;
}

export interface Member {
  id: string;
  user: UserBasic;
  nickname?: string;
  roles: Role[];
  joined_at: string;
}

// Forum types
export interface Forum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  is_public: boolean;
  post_count: number;
  member_count: number;
  rules?: string;
  flairs: Flair[];
  inserted_at: string;
}

// MyBB Forum Feature Types
export interface ThreadPrefix {
  id: string;
  name: string;
  color: string;
  forums: string[];
}

export interface ThreadRating {
  id: string;
  thread_id: string;
  user_id: string;
  rating: number; // 1-5 stars
  created_at: string;
}

export interface PostAttachment {
  id: string;
  post_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
  download_url: string;
  downloads: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Poll {
  id: string;
  thread_id: string;
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  max_selections?: number;
  timeout?: string;
  public: boolean;
  closed: boolean;
  created_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

export interface PostEditHistory {
  id: string;
  post_id: string;
  edited_by: string;
  edited_by_username: string;
  previous_content: string;
  reason?: string;
  edited_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'poll';
  author: UserBasic;
  forum: { id: string; name: string; slug: string };
  flair?: Flair;
  vote_count: number;
  comment_count: number;
  my_vote?: 1 | -1;
  is_pinned: boolean;
  is_locked: boolean;
  inserted_at: string;
  // MyBB Features
  prefix?: ThreadPrefix;
  rating?: number;
  rating_count?: number;
  my_rating?: number;
  attachments?: PostAttachment[];
  poll?: Poll;
  edit_history?: PostEditHistory[];
  views?: number;
  is_closed?: boolean;
  edited_at?: string;
  edited_by?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: UserBasic;
  post_id: string;
  parent_id?: string;
  replies?: Comment[];
  vote_count: number;
  my_vote?: 1 | -1;
  is_edited: boolean;
  inserted_at: string;
  // MyBB Features
  attachments?: PostAttachment[];
  edit_history?: PostEditHistory[];
  edited_at?: string;
  edited_by?: string;
}

export interface Flair {
  id: string;
  name: string;
  color: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  TwoFactorVerify: { twoFactorToken: string };
  ResetPassword: { token: string };
  VerifyEmail: { token: string };
  QrLoginScanner: undefined;
};

export type MainTabParamList = {
  MessagesTab: undefined;
  FriendsTab: undefined;
  NotificationsTab: undefined;
  SearchTab: undefined;
  GroupsTab: undefined;
  ForumsTab: undefined;
  SettingsTab: undefined;
};

export type CallsStackParamList = {
  Call: {
    recipientId: string;
    callType: 'audio' | 'video';
    incoming?: boolean;
    roomId?: string;
  };
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Conversation: { conversationId: string };
  NewConversation: undefined;
  SavedMessages: undefined;
  SafetyNumber: { recipientId: string; recipientName: string };
};

export type NotificationsStackParamList = {
  NotificationsInbox: undefined;
};

export type FriendsStackParamList = {
  FriendList: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
  UserProfile: { userId: string };
  Leaderboard: undefined;
  Contacts: undefined;
  UserSearch: undefined;
  ProfileEdit: { userId?: string };
};

export type SearchStackParamList = {
  SearchMain: undefined;
  SearchResults: { query: string; category?: string };
};

export type GroupsStackParamList = {
  GroupList: undefined;
  CreateGroup: undefined;
  ExploreGroups: undefined;
  Group: { groupId: string };
  Channel: { groupId: string; channelId: string };
  GroupSettings: { groupId: string };
  GroupRoles: { groupId: string };
  GroupMembers: { groupId: string };
  GroupChannels: { groupId: string };
  GroupInvites: { groupId: string };
  GroupModeration: { groupId: string };
  ChannelPermissions: { channelId: string; groupId: string };
};

export type ForumsStackParamList = {
  ForumList: undefined;
  Forum: { forumId: string };
  Post: { postId: string };
  CreatePost: { forumId: string };
  CreateForum: undefined;
  // MyBB-style forum screens
  ForumBoard: { forumId: string; boardId: string; boardName?: string };
  ForumSettings: { forumId: string };
  ForumAdmin: { forumId: string };
  ForumLeaderboard: { forumId?: string };
  PluginMarketplace: { forumId?: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  Account: undefined;
  Appearance: undefined;
  UICustomization: undefined;
  ChatBubbles: undefined;
  AvatarSettings: undefined;
  Notifications: undefined;
  DndSchedule: undefined;
  Privacy: undefined;
  Premium: undefined;
  CoinShop: undefined;
  Calendar: undefined;
  Leaderboard: undefined;
  Referrals: undefined;
  HolographicDemo: undefined;
  // Gamification screens
  GamificationHub: undefined;
  Achievements: undefined;
  Quests: undefined;
  Titles: undefined;
  // New screens
  ProfileVisibility: undefined;
  RSSFeeds: { forumId?: string; forumName?: string };
  CustomEmoji: undefined;
  MemberList: undefined;
  WhosOnline: undefined;
  E2EEVerification: { userId: string; username: string };
  AdminDashboard: undefined;
  ForumReorder: undefined;
  // Security screens
  TwoFactorSetup: undefined;
  BlockedUsers: undefined;
  KeyVerification: { userId: string; username: string };
  EmailNotifications: undefined;
  // Social screens
  CustomStatus: undefined;
  // Customize hub screens
  Customize: undefined;
  IdentityCustomization: undefined;
  EffectsCustomization: undefined;
  ProgressionCustomization: undefined;
  BadgeSelection: undefined;
  TitleSelection: undefined;
  ExportContent: { type: 'thread' | 'post' | 'conversation'; id: string; title: string };
  // Legal screens
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  CookiePolicy: undefined;
  GDPR: undefined;
  // Session management
  Sessions: undefined;
  // Device management (E2EE multi-device)
  LinkedDevices: undefined;
};

// Friend types
export interface Friend {
  id: string;
  user: UserBasic;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface FriendRequest {
  id: string;
  user: UserBasic;
  type: 'incoming' | 'outgoing';
  created_at: string;
}
