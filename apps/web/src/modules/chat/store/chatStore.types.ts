/**
 * Chat Store — Type Definitions
 *
 * All interfaces and types used across the chat module.
 * Includes message, conversation, participant, reaction,
 * and scheduling types.
 *
 * @module modules/chat/store/chatStore.types
 */

// ── Core Message Types ─────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  encryptedContent: string | null;
  isEncrypted: boolean;
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
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: MessageMetadata;
  reactions: Reaction[];
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    theme?: string | null;
    // Sender customization fields (populated from backend user_customizations)
    equippedTitleId?: string | null;
    bubbleStyle?: string | null;
    bubbleColor?: string | null;
    bubbleRadius?: number | null;
    bubbleOpacity?: number | null;
    messageEffect?: string | null;
    reactionStyle?: string | null;
    chatTheme?: string | null;
    profileTheme?: string | null;
    entranceAnimation?: string | null;
    glassEffect?: string | null;
    textColor?: string | null;
    textSize?: number | null;
    fontFamily?: string | null;
  };
  senderTheme?: string | null;
  edits?: EditHistory[];
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
  // E2EE metadata for decryption
  ephemeralPublicKey?: string;
  nonce?: string;
  senderIdentityKey?: string;
  // Message scheduling
  scheduledAt?: string | null;
  scheduleStatus?: 'immediate' | 'scheduled' | 'sent' | 'cancelled';
}

/**
 * Message metadata — extensible with typed common properties
 */
export interface MessageMetadata {
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number;
  waveform?: number[];
  width?: number;
  height?: number;
  readBy?: Array<{ userId: string; readAt: string }>;
  stickerId?: string;
  stickerPackId?: string;
  gifId?: string;
  gifUrl?: string;
  [key: string]: unknown;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface EditHistory {
  id: string;
  messageId: string;
  previousContent: string;
  editNumber: number;
  editedById: string;
  createdAt: string;
}

// ── Conversation Types ─────────────────────────────────────────────────

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  isGroup?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastSeenAt?: string | null;
    avatarBorderId?: string | null;
    level?: number;
    xp?: number;
    karma?: number;
    streak?: number;
    bio?: string | null;
    badges?: string[];
    theme?: string | null;
    sharedForums?: Array<{ id: string; name: string }>;
  };
  nickname: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  joinedAt: string;
}

// ── Typing & State Types ───────────────────────────────────────────────

export interface TypingUserInfo {
  userId: string;
  startedAt?: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  messageIdSets: Record<string, Set<string>>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string[]>;
  typingUsersInfo: Record<string, TypingUserInfo[]>;
  hasMoreMessages: Record<string, boolean>;
  conversationsLastFetchedAt: number | null;
  readReceipts: Record<string, Record<string, string>>; // messageId → userId → readAt
  scheduledMessages: Record<string, Message[]>;
  isLoadingScheduledMessages: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: { type?: string; metadata?: Record<string, unknown>; forceUnencrypted?: boolean }
  ) => Promise<void>;
  sendEncryptedMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    replyToId?: string
  ) => Promise<void>;
  decryptAndAddMessage: (message: Message) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  markMessageDeleted: (messageId: string) => void;
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
    startedAt?: string
  ) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message['deliveryStatus']) => void;
  addReadReceipt: (conversationId: string, messageId: string, userId: string, readAt: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (userIds: string[]) => Promise<Conversation>;
  getRecipientId: (conversationId: string, currentUserId: string) => string | null;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    username?: string
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
  fetchScheduledMessages: (conversationId: string) => Promise<void>;
  scheduleMessage: (
    conversationId: string,
    content: string,
    scheduledAt: Date,
    options?: { type?: string; metadata?: Record<string, unknown>; replyToId?: string }
  ) => Promise<void>;
  cancelScheduledMessage: (messageId: string) => Promise<void>;
  rescheduleMessage: (messageId: string, newScheduledAt: Date) => Promise<void>;
  reset: () => void;
}
