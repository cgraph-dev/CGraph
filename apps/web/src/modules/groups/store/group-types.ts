/**
 * Group store type definitions.
 * All interfaces used by the group store.
 */

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
  categories: ChannelCategory[];
  channels: Channel[];
  roles: Role[];
  myMember: Member | null;
  createdAt: string;
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
  type: 'text' | 'voice' | 'video' | 'announcement' | 'forum';
  topic: string | null;
  categoryId: string | null;
  position: number;
  isNsfw: boolean;
  slowModeSeconds: number;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  isDefault: boolean;
  isMentionable: boolean;
}

export interface Member {
  id: string;
  userId: string;
  nickname: string | null;
  notifications?: 'all' | 'mentions' | 'none';
  suppressEveryone?: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
  };
  roles: Role[];
  joinedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  messageType:
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'audio'
    | 'voice'
    | 'sticker'
    | 'gif'
    | 'system';
  replyToId: string | null;
  replyTo: ChannelMessage | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    member: Member | null;
  };
  createdAt: string;
}

export interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  activeChannelId: string | null;
  channelMessages: Record<string, ChannelMessage[]>;
  members: Record<string, Member[]>;
  isLoadingGroups: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
  justJoinedGroupName: string | null;
  /** Discoverable public groups fetched from explore */
  discoverableGroups: Group[];
  /** Loading state for discoverable groups */
  isLoadingDiscover: boolean;
  /** Current discover search term */
  discoverSearch: string;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  fetchChannelMessages: (channelId: string, before?: string) => Promise<void>;
  fetchMembers: (groupId: string) => Promise<void>;
  sendChannelMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  addChannelMessage: (message: ChannelMessage) => void;
  updateChannelMessage: (message: ChannelMessage) => void;
  removeChannelMessage: (messageId: string, channelId: string) => void;
  setTypingUser: (channelId: string, userId: string, isTyping: boolean) => void;
  createGroup: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroup: (
    groupId: string,
    data: Partial<Pick<Group, 'name' | 'description' | 'isPublic' | 'iconUrl' | 'bannerUrl'>>
  ) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateChannelOrder: (groupId: string, channelIds: string[]) => Promise<void>;
  createInvite: (
    groupId: string,
    options?: { maxUses?: number; expiresIn?: number }
  ) => Promise<{ code: string; expiresAt: string }>;
  fetchDiscoverableGroups: (params?: {
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  joinPublicGroup: (groupId: string) => Promise<void>;
  clearJoinCelebration: () => void;
  reset: () => void;
}
