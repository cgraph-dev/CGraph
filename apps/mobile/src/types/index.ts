// User types
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  wallet_address?: string;
  inserted_at: string;
  updated_at: string;
}

export interface UserBasic {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: string;
}

// Message types
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  attachments: Attachment[];
  sender: UserBasic;
  sender_id: string;
  conversation_id?: string;
  channel_id?: string;
  reply_to_id?: string;
  reply_to?: Message;
  reactions: Reaction[];
  is_edited: boolean;
  is_deleted: boolean;
  inserted_at: string;
  updated_at: string;
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

// Conversation types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: UserBasic[];
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
};

export type MainTabParamList = {
  MessagesTab: undefined;
  GroupsTab: undefined;
  ForumsTab: undefined;
  SettingsTab: undefined;
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Conversation: { conversationId: string };
  NewConversation: undefined;
};

export type GroupsStackParamList = {
  GroupList: undefined;
  Group: { groupId: string };
  Channel: { groupId: string; channelId: string };
  GroupSettings: { groupId: string };
};

export type ForumsStackParamList = {
  ForumList: undefined;
  Forum: { forumId: string };
  Post: { postId: string };
  CreatePost: { forumId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  Profile: undefined;
  Account: undefined;
  Appearance: undefined;
  Notifications: undefined;
  Privacy: undefined;
};
