import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('pmStore');

/**
 * Private Messaging Store
 *
 * Complete PM system with MyBB-style features:
 * - Folders (Inbox, Sent, Drafts, Trash, Custom)
 * - Multiple recipients with BCC support
 * - Read receipts and tracking
 * - Message search and filtering
 * - Archive/export functionality
 */

// PM Folder types
export interface PMFolder {
  id: string;
  name: string;
  type: 'system' | 'custom'; // System: inbox, sent, drafts, trash
  icon?: string;
  color?: string;
  messageCount: number;
  unreadCount: number;
  order: number;
}

// PM Participant
export interface PMParticipant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isBcc?: boolean; // Blind carbon copy
}

// Private Message
export interface PrivateMessage {
  id: string;
  subject: string;
  content: string; // BBCode/HTML content

  // Sender
  senderId: string;
  senderUsername: string;
  senderDisplayName: string | null;
  senderAvatarUrl: string | null;

  // Recipients
  recipients: PMParticipant[];
  bccRecipients?: PMParticipant[]; // Only visible to sender

  // Status
  folderId: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDraft: boolean;

  // Read receipt
  readAt: string | null;
  readReceiptEnabled: boolean;

  // Attachments
  hasAttachments: boolean;
  attachments?: PMAttachment[];

  // Reply chain
  parentId: string | null;
  replyCount: number;

  // Dates
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;

  // Post icon (decorative)
  postIcon?: string;
}

// PM Attachment
export interface PMAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}

// PM Conversation (grouped messages)
export interface PMConversation {
  id: string;
  subject: string;
  participants: PMParticipant[];
  lastMessage: PrivateMessage;
  messageCount: number;
  unreadCount: number;
  isStarred: boolean;
  updatedAt: string;
}

// Create/Send PM data
export interface CreatePMData {
  subject: string;
  content: string;
  recipientIds: string[];
  recipientUsernames?: string[]; // For username input
  bccRecipientIds?: string[];
  isDraft?: boolean;
  parentId?: string; // For replies
  postIcon?: string;
  readReceiptEnabled?: boolean;
  attachmentIds?: string[];
  signature?: boolean; // Include signature
}

// PM Search filters
export interface PMSearchFilters {
  query?: string;
  folderId?: string;
  fromUserId?: string;
  toUserId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// PM Settings
export interface PMSettings {
  showSignature: boolean;
  defaultReadReceipt: boolean;
  notifyOnNewPM: boolean;
  notifyViaEmail: boolean;
  blockNonFriends: boolean;
  autoDeleteTrash: number; // Days, 0 = never
  maxStoredPMs: number;
}

interface PMState {
  // Messages
  messages: PrivateMessage[];
  currentMessage: PrivateMessage | null;
  conversations: PMConversation[];

  // Folders
  folders: PMFolder[];
  currentFolderId: string;

  // Drafts
  drafts: PrivateMessage[];
  currentDraft: Partial<CreatePMData> | null;

  // Loading states
  isLoading: boolean;
  isSending: boolean;

  // Pagination
  hasMore: boolean;
  page: number;

  // Settings
  settings: PMSettings;

  // Counts
  totalUnread: number;

  // Actions - Folders
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, color?: string) => Promise<PMFolder>;
  updateFolder: (folderId: string, data: Partial<PMFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;

  // Actions - Messages
  fetchMessages: (folderId?: string, page?: number) => Promise<void>;
  fetchMessage: (messageId: string) => Promise<PrivateMessage>;
  sendMessage: (data: CreatePMData) => Promise<PrivateMessage>;
  saveDraft: (data: CreatePMData) => Promise<PrivateMessage>;
  updateDraft: (draftId: string, data: Partial<CreatePMData>) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;

  // Actions - Message operations
  markAsRead: (messageIds: string[]) => Promise<void>;
  markAsUnread: (messageIds: string[]) => Promise<void>;
  starMessage: (messageId: string) => Promise<void>;
  unstarMessage: (messageId: string) => Promise<void>;
  moveToFolder: (messageIds: string[], folderId: string) => Promise<void>;
  deleteMessages: (messageIds: string[], permanent?: boolean) => Promise<void>;
  restoreMessages: (messageIds: string[]) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<PrivateMessage[]>;

  // Actions - Search
  searchMessages: (filters: PMSearchFilters) => Promise<PrivateMessage[]>;

  // Actions - Export
  exportMessages: (messageIds: string[], format: 'txt' | 'html' | 'json') => Promise<Blob>;

  // Actions - Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PMSettings>) => Promise<void>;

  // Actions - Helpers
  getUnreadCount: () => number;
  setCurrentDraft: (draft: Partial<CreatePMData> | null) => void;
  clearMessages: () => void;
}

// System folder IDs
const SYSTEM_FOLDERS = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  TRASH: 'trash',
};

export const usePMStore = create<PMState>((set, get) => ({
  // Initial state
  messages: [],
  currentMessage: null,
  conversations: [],
  folders: [
    { id: 'inbox', name: 'Inbox', type: 'system', messageCount: 0, unreadCount: 0, order: 0 },
    { id: 'sent', name: 'Sent', type: 'system', messageCount: 0, unreadCount: 0, order: 1 },
    { id: 'drafts', name: 'Drafts', type: 'system', messageCount: 0, unreadCount: 0, order: 2 },
    { id: 'trash', name: 'Trash', type: 'system', messageCount: 0, unreadCount: 0, order: 3 },
  ],
  currentFolderId: 'inbox',
  drafts: [],
  currentDraft: null,
  isLoading: false,
  isSending: false,
  hasMore: true,
  page: 1,
  settings: {
    showSignature: true,
    defaultReadReceipt: false,
    notifyOnNewPM: true,
    notifyViaEmail: true,
    blockNonFriends: false,
    autoDeleteTrash: 30,
    maxStoredPMs: 500,
  },
  totalUnread: 0,

  // ========================================
  // FOLDER ACTIONS
  // ========================================

  fetchFolders: async () => {
    try {
      const response = await api.get('/api/v1/pm/folders');
      const folders = (ensureArray(response.data, 'folders') as Record<string, unknown>[]).map(
        (f) => ({
          id: f.id as string,
          name: f.name as string,
          type: (f.type as 'system' | 'custom') || 'custom',
          icon: f.icon as string | undefined,
          color: f.color as string | undefined,
          messageCount: (f.message_count as number) || 0,
          unreadCount: (f.unread_count as number) || 0,
          order: (f.order as number) || 0,
        })
      );

      // Merge with system folders
      const systemFolders = get().folders.filter((f) => f.type === 'system');
      const customFolders = folders.filter((f) => f.type === 'custom');

      // Update counts in system folders
      const updatedSystemFolders = systemFolders.map((sf) => {
        const apiFolder = folders.find((f) => f.id === sf.id);
        return apiFolder ? { ...sf, ...apiFolder } : sf;
      });

      set({ folders: [...updatedSystemFolders, ...customFolders] });
    } catch (error) {
      logger.error('Failed to fetch folders:', error);
    }
  },

  createFolder: async (name: string, color?: string) => {
    try {
      const response = await api.post('/api/v1/pm/folders', { name, color });
      const folder: PMFolder = {
        id: response.data.folder.id,
        name: response.data.folder.name,
        type: 'custom',
        color: response.data.folder.color,
        messageCount: 0,
        unreadCount: 0,
        order: get().folders.length,
      };
      set((state) => ({ folders: [...state.folders, folder] }));
      return folder;
    } catch (error) {
      logger.error('Failed to create folder:', error);
      throw error;
    }
  },

  updateFolder: async (folderId: string, data: Partial<PMFolder>) => {
    try {
      await api.put(`/api/v1/pm/folders/${folderId}`, {
        name: data.name,
        color: data.color,
        order: data.order,
      });
      set((state) => ({
        folders: state.folders.map((f) => (f.id === folderId ? { ...f, ...data } : f)),
      }));
    } catch (error) {
      logger.error('Failed to update folder:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId: string) => {
    try {
      await api.delete(`/api/v1/pm/folders/${folderId}`);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== folderId),
      }));
    } catch (error) {
      logger.error('Failed to delete folder:', error);
      throw error;
    }
  },

  // ========================================
  // MESSAGE ACTIONS
  // ========================================

  fetchMessages: async (folderId?: string, page = 1) => {
    const targetFolder = folderId || get().currentFolderId;
    set({ isLoading: true, currentFolderId: targetFolder });

    try {
      const response = await api.get('/api/v1/pm/messages', {
        params: { folder_id: targetFolder, page, per_page: 25 },
      });

      const messages = (ensureArray(response.data, 'messages') as Record<string, unknown>[]).map(
        mapMessageFromApi
      );

      set({
        messages: page === 1 ? messages : [...get().messages, ...messages],
        hasMore: messages.length === 25,
        page,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  fetchMessage: async (messageId: string) => {
    try {
      const response = await api.get(`/api/v1/pm/messages/${messageId}`);
      const message = mapMessageFromApi(response.data.message || response.data);
      set({ currentMessage: message });

      // Mark as read if not already
      if (!message.isRead) {
        get().markAsRead([messageId]);
      }

      return message;
    } catch (error) {
      logger.error('Failed to fetch message:', error);
      throw error;
    }
  },

  sendMessage: async (data: CreatePMData) => {
    set({ isSending: true });
    try {
      const response = await api.post('/api/v1/pm/messages', {
        subject: data.subject,
        content: data.content,
        recipient_ids: data.recipientIds,
        recipient_usernames: data.recipientUsernames,
        bcc_recipient_ids: data.bccRecipientIds,
        parent_id: data.parentId,
        post_icon: data.postIcon,
        read_receipt_enabled: data.readReceiptEnabled ?? get().settings.defaultReadReceipt,
        attachment_ids: data.attachmentIds,
        include_signature: data.signature ?? get().settings.showSignature,
      });

      const message = mapMessageFromApi(response.data.message || response.data);

      // Update sent folder count
      set((state) => ({
        isSending: false,
        folders: state.folders.map((f) =>
          f.id === SYSTEM_FOLDERS.SENT ? { ...f, messageCount: f.messageCount + 1 } : f
        ),
      }));

      return message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      set({ isSending: false });
      throw error;
    }
  },

  saveDraft: async (data: CreatePMData) => {
    try {
      const response = await api.post('/api/v1/pm/drafts', {
        subject: data.subject,
        content: data.content,
        recipient_ids: data.recipientIds,
        recipient_usernames: data.recipientUsernames,
        bcc_recipient_ids: data.bccRecipientIds,
        parent_id: data.parentId,
        post_icon: data.postIcon,
        attachment_ids: data.attachmentIds,
      });

      const draft = mapMessageFromApi(response.data.draft || response.data);
      draft.isDraft = true;

      set((state) => ({
        drafts: [...state.drafts, draft],
        folders: state.folders.map((f) =>
          f.id === SYSTEM_FOLDERS.DRAFTS ? { ...f, messageCount: f.messageCount + 1 } : f
        ),
      }));

      return draft;
    } catch (error) {
      logger.error('Failed to save draft:', error);
      throw error;
    }
  },

  updateDraft: async (draftId: string, data: Partial<CreatePMData>) => {
    try {
      await api.put(`/api/v1/pm/drafts/${draftId}`, {
        subject: data.subject,
        content: data.content,
        recipient_ids: data.recipientIds,
        bcc_recipient_ids: data.bccRecipientIds,
      });

      set((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === draftId
            ? { ...d, subject: data.subject || d.subject, content: data.content || d.content }
            : d
        ),
      }));
    } catch (error) {
      logger.error('Failed to update draft:', error);
      throw error;
    }
  },

  deleteDraft: async (draftId: string) => {
    try {
      await api.delete(`/api/v1/pm/drafts/${draftId}`);
      set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== draftId),
        folders: state.folders.map((f) =>
          f.id === SYSTEM_FOLDERS.DRAFTS
            ? { ...f, messageCount: Math.max(0, f.messageCount - 1) }
            : f
        ),
      }));
    } catch (error) {
      logger.error('Failed to delete draft:', error);
      throw error;
    }
  },

  // ========================================
  // MESSAGE OPERATIONS
  // ========================================

  markAsRead: async (messageIds: string[]) => {
    try {
      await api.post('/api/v1/pm/messages/mark-read', { message_ids: messageIds });
      set((state) => ({
        messages: state.messages.map((m) =>
          messageIds.includes(m.id) ? { ...m, isRead: true } : m
        ),
        totalUnread: Math.max(0, state.totalUnread - messageIds.length),
      }));
    } catch (error) {
      logger.error('Failed to mark as read:', error);
    }
  },

  markAsUnread: async (messageIds: string[]) => {
    try {
      await api.post('/api/v1/pm/messages/mark-unread', { message_ids: messageIds });
      set((state) => ({
        messages: state.messages.map((m) =>
          messageIds.includes(m.id) ? { ...m, isRead: false } : m
        ),
        totalUnread: state.totalUnread + messageIds.length,
      }));
    } catch (error) {
      logger.error('Failed to mark as unread:', error);
    }
  },

  starMessage: async (messageId: string) => {
    try {
      await api.post(`/api/v1/pm/messages/${messageId}/star`);
      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, isStarred: true } : m)),
      }));
    } catch (error) {
      logger.error('Failed to star message:', error);
    }
  },

  unstarMessage: async (messageId: string) => {
    try {
      await api.delete(`/api/v1/pm/messages/${messageId}/star`);
      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, isStarred: false } : m)),
      }));
    } catch (error) {
      logger.error('Failed to unstar message:', error);
    }
  },

  moveToFolder: async (messageIds: string[], folderId: string) => {
    try {
      await api.post('/api/v1/pm/messages/move', {
        message_ids: messageIds,
        folder_id: folderId,
      });
      set((state) => ({
        messages: state.messages.map((m) => (messageIds.includes(m.id) ? { ...m, folderId } : m)),
      }));
    } catch (error) {
      logger.error('Failed to move messages:', error);
      throw error;
    }
  },

  deleteMessages: async (messageIds: string[], permanent = false) => {
    try {
      if (permanent) {
        await api.delete('/api/v1/pm/messages', {
          data: { message_ids: messageIds, permanent: true },
        });
        set((state) => ({
          messages: state.messages.filter((m) => !messageIds.includes(m.id)),
        }));
      } else {
        // Move to trash
        await get().moveToFolder(messageIds, SYSTEM_FOLDERS.TRASH);
      }
    } catch (error) {
      logger.error('Failed to delete messages:', error);
      throw error;
    }
  },

  restoreMessages: async (messageIds: string[]) => {
    try {
      await api.post('/api/v1/pm/messages/restore', { message_ids: messageIds });
      // Move back to inbox
      set((state) => ({
        messages: state.messages.map((m) =>
          messageIds.includes(m.id) ? { ...m, folderId: SYSTEM_FOLDERS.INBOX } : m
        ),
      }));
    } catch (error) {
      logger.error('Failed to restore messages:', error);
      throw error;
    }
  },

  emptyTrash: async () => {
    try {
      await api.delete('/api/v1/pm/trash');
      set((state) => ({
        messages: state.messages.filter((m) => m.folderId !== SYSTEM_FOLDERS.TRASH),
        folders: state.folders.map((f) =>
          f.id === SYSTEM_FOLDERS.TRASH ? { ...f, messageCount: 0 } : f
        ),
      }));
    } catch (error) {
      logger.error('Failed to empty trash:', error);
      throw error;
    }
  },

  // ========================================
  // CONVERSATIONS
  // ========================================

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/v1/pm/conversations');
      const conversations = (
        ensureArray(response.data, 'conversations') as Record<string, unknown>[]
      ).map((c) => ({
        id: c.id as string,
        subject: c.subject as string,
        participants: (
          ensureArray(c.participants, 'participants') as Record<string, unknown>[]
        ).map(mapParticipant),
        lastMessage: mapMessageFromApi(c.last_message as Record<string, unknown>),
        messageCount: (c.message_count as number) || 0,
        unreadCount: (c.unread_count as number) || 0,
        isStarred: (c.is_starred as boolean) || false,
        updatedAt: (c.updated_at as string) || new Date().toISOString(),
      }));
      set({ conversations, isLoading: false });
    } catch (error) {
      logger.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  fetchConversation: async (conversationId: string) => {
    try {
      const response = await api.get(`/api/v1/pm/conversations/${conversationId}`);
      const messages = (ensureArray(response.data, 'messages') as Record<string, unknown>[]).map(
        mapMessageFromApi
      );
      return messages;
    } catch (error) {
      logger.error('Failed to fetch conversation:', error);
      throw error;
    }
  },

  // ========================================
  // SEARCH
  // ========================================

  searchMessages: async (filters: PMSearchFilters) => {
    try {
      const response = await api.get('/api/v1/pm/search', {
        params: {
          q: filters.query,
          folder_id: filters.folderId,
          from_user_id: filters.fromUserId,
          to_user_id: filters.toUserId,
          is_read: filters.isRead,
          is_starred: filters.isStarred,
          has_attachments: filters.hasAttachments,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
        },
      });
      return (ensureArray(response.data, 'messages') as Record<string, unknown>[]).map(
        mapMessageFromApi
      );
    } catch (error) {
      logger.error('Failed to search messages:', error);
      return [];
    }
  },

  // ========================================
  // EXPORT
  // ========================================

  exportMessages: async (messageIds: string[], format: 'txt' | 'html' | 'json') => {
    try {
      const response = await api.post(
        '/api/v1/pm/export',
        {
          message_ids: messageIds,
          format,
        },
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to export messages:', error);
      throw error;
    }
  },

  // ========================================
  // SETTINGS
  // ========================================

  fetchSettings: async () => {
    try {
      const response = await api.get('/api/v1/pm/settings');
      const data = response.data.settings || response.data;
      set({
        settings: {
          showSignature: data.show_signature ?? true,
          defaultReadReceipt: data.default_read_receipt ?? false,
          notifyOnNewPM: data.notify_on_new_pm ?? true,
          notifyViaEmail: data.notify_via_email ?? true,
          blockNonFriends: data.block_non_friends ?? false,
          autoDeleteTrash: data.auto_delete_trash ?? 30,
          maxStoredPMs: data.max_stored_pms ?? 500,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch PM settings:', error);
    }
  },

  updateSettings: async (settings: Partial<PMSettings>) => {
    try {
      await api.put('/api/v1/pm/settings', {
        show_signature: settings.showSignature,
        default_read_receipt: settings.defaultReadReceipt,
        notify_on_new_pm: settings.notifyOnNewPM,
        notify_via_email: settings.notifyViaEmail,
        block_non_friends: settings.blockNonFriends,
        auto_delete_trash: settings.autoDeleteTrash,
      });
      set((state) => ({
        settings: { ...state.settings, ...settings },
      }));
    } catch (error) {
      logger.error('Failed to update PM settings:', error);
      throw error;
    }
  },

  // ========================================
  // HELPERS
  // ========================================

  getUnreadCount: () => {
    return get().folders.find((f) => f.id === SYSTEM_FOLDERS.INBOX)?.unreadCount || 0;
  },

  setCurrentDraft: (draft: Partial<CreatePMData> | null) => {
    set({ currentDraft: draft });
  },

  clearMessages: () => {
    set({ messages: [], currentMessage: null, page: 1, hasMore: true });
  },
}));

// Helper: Map API response to PrivateMessage
function mapMessageFromApi(data: Record<string, unknown>): PrivateMessage {
  return {
    id: data.id as string,
    subject: (data.subject as string) || '(No Subject)',
    content: (data.content as string) || '',
    senderId: data.sender_id as string,
    senderUsername: (data.sender_username as string) || 'Unknown',
    senderDisplayName: (data.sender_display_name as string) || null,
    senderAvatarUrl: (data.sender_avatar_url as string) || null,
    recipients: (ensureArray(data.recipients, 'recipients') as Record<string, unknown>[]).map(
      mapParticipant
    ),
    bccRecipients: data.bcc_recipients
      ? (ensureArray(data.bcc_recipients, 'bcc_recipients') as Record<string, unknown>[]).map(
          mapParticipant
        )
      : undefined,
    folderId: (data.folder_id as string) || 'inbox',
    isRead: (data.is_read as boolean) || false,
    isStarred: (data.is_starred as boolean) || false,
    isArchived: (data.is_archived as boolean) || false,
    isDraft: (data.is_draft as boolean) || false,
    readAt: (data.read_at as string) || null,
    readReceiptEnabled: (data.read_receipt_enabled as boolean) || false,
    hasAttachments: (data.has_attachments as boolean) || false,
    attachments: data.attachments
      ? (ensureArray(data.attachments, 'attachments') as Record<string, unknown>[]).map((a) => ({
          id: a.id as string,
          filename: a.filename as string,
          size: a.size as number,
          mimeType: a.mime_type as string,
          url: a.url as string,
          thumbnailUrl: a.thumbnail_url as string | undefined,
        }))
      : undefined,
    parentId: (data.parent_id as string) || null,
    replyCount: (data.reply_count as number) || 0,
    createdAt:
      (data.created_at as string) || (data.inserted_at as string) || new Date().toISOString(),
    updatedAt: (data.updated_at as string) || new Date().toISOString(),
    sentAt: (data.sent_at as string) || null,
    postIcon: data.post_icon as string | undefined,
  };
}

// Helper: Map participant
function mapParticipant(p: Record<string, unknown>): PMParticipant {
  return {
    id: p.id as string,
    username: (p.username as string) || 'Unknown',
    displayName: (p.display_name as string) || null,
    avatarUrl: (p.avatar_url as string) || null,
    isBcc: (p.is_bcc as boolean) || false,
  };
}

export { SYSTEM_FOLDERS };
