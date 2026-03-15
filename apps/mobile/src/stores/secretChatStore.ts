/**
 * Secret Chat Store — Zustand store for encrypted secret conversations.
 *
 * Manages PQXDH sessions, encrypted messages, ghost mode, and panic wipe.
 * Uses manual AsyncStorage persistence (no zustand persist middleware).
 * Crypto operations use pq-bridge directly for post-quantum key exchange.
 *
 * @module stores/secretChatStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initiateSession,
  encryptMessage,
  decryptMessage,
  closeAllSessions,
  closeSession,
} from '@/lib/crypto/pq-bridge';
import { InMemoryProtocolStore, type TripleRatchetMessage } from '@cgraph/crypto';
import { secretChatService } from '@/services/secretChatService';
import { createLogger } from '@/lib/logger';
import { Buffer } from 'buffer';

const logger = createLogger('SecretChatStore');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_CONVERSATIONS = '@cgraph_secret_conversations';
const STORAGE_KEY_MESSAGES = '@cgraph_secret_messages';
const STORAGE_KEY_THEME = '@cgraph_secret_theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SecretThemeId =
  | 'void'
  | 'redacted'
  | 'midnight'
  | 'signal'
  | 'ghost'
  | 'cipher'
  | 'onyx'
  | 'eclipse'
  | 'static'
  | 'shadow'
  | 'obsidian'
  | 'abyss';

export interface SecretConversation {
  readonly id: string;
  readonly recipientId: string;
  readonly recipientName: string;
  readonly sessionId: string;
  readonly createdAt: number;
  readonly lastMessageAt: number;
}

export interface SecretMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly ciphertext: string; // base64-encoded ciphertext
  readonly plaintext?: string; // decrypted content (ephemeral, not persisted)
  readonly timestamp: number;
  readonly isOwn: boolean;
}

export type GhostModeTimer = number | null; // seconds remaining, null = off

interface SecretChatState {
  readonly conversations: SecretConversation[];
  readonly messages: Record<string, SecretMessage[]>;
  readonly activeConversationId: string | null;
  readonly activeTheme: SecretThemeId;
  readonly ghostModeTimer: GhostModeTimer;
  readonly isLoading: boolean;
}

interface SecretChatActions {
  readonly initialize: () => Promise<void>;
  readonly createSession: (recipientId: string, recipientName: string) => Promise<string>;
  readonly sendMessage: (conversationId: string, text: string) => Promise<void>;
  readonly receiveMessage: (msg: {
    conversationId: string;
    senderId: string;
    ciphertext: string;
    messageId: string;
    timestamp: number;
  }) => Promise<void>;
  readonly setTheme: (themeId: SecretThemeId) => Promise<void>;
  readonly enableGhostMode: (seconds: number | null) => void;
  readonly panicWipe: () => Promise<void>;
  readonly setActiveConversation: (id: string | null) => void;
  readonly deleteConversation: (id: string) => Promise<void>;
  readonly reset: () => void;
}

type SecretChatStore = SecretChatState & SecretChatActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistConversations(conversations: SecretConversation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    logger.error('Failed to persist secret conversations');
  }
}

async function persistMessages(messages: Record<string, SecretMessage[]>): Promise<void> {
  try {
    // Strip plaintext before persisting — only ciphertext is stored
    const safe: Record<string, SecretMessage[]> = {};
    for (const [key, msgs] of Object.entries(messages)) {
      safe[key] = msgs.map(({ plaintext: _pt, ...rest }) => rest);
    }
    await AsyncStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(safe));
  } catch {
    logger.error('Failed to persist secret messages');
  }
}

// ---------------------------------------------------------------------------
// Ghost mode interval
// ---------------------------------------------------------------------------

let ghostInterval: ReturnType<typeof setInterval> | null = null;

function clearGhostInterval(): void {
  if (ghostInterval !== null) {
    clearInterval(ghostInterval);
    ghostInterval = null;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSecretChatStore = create<SecretChatStore>((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────
  conversations: [],
  messages: {},
  activeConversationId: null,
  activeTheme: 'void',
  ghostModeTimer: null,
  isLoading: false,

  // ─── Initialize ────────────────────────────────────────────────────
  initialize: async () => {
    try {
      const [storedConversations, storedMessages, storedTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_CONVERSATIONS),
        AsyncStorage.getItem(STORAGE_KEY_MESSAGES),
        AsyncStorage.getItem(STORAGE_KEY_THEME),
      ]);

      set({
        conversations: storedConversations ? JSON.parse(storedConversations) : [],
        messages: storedMessages ? JSON.parse(storedMessages) : {},
         
        activeTheme: (storedTheme as SecretThemeId) ?? 'void',
      });
    } catch {
      logger.error('Failed to load secret chat state from storage');
    }
  },

  // ─── Create Session ────────────────────────────────────────────────
  createSession: async (recipientId: string, recipientName: string) => {
    set({ isLoading: true });
    try {
      // Fetch recipient's prekey bundle from the server
      const { data } = await secretChatService.fetchPrekeyBundle(recipientId);
      const { bundle } = data;

      // Initiate PQXDH session with the recipient's bundle
      const protocolStore = new InMemoryProtocolStore(
        { publicKey: new Uint8Array(32), privateKey: new Uint8Array(32) },
        1
      );
      const { session } = await initiateSession(bundle, protocolStore);
      const conversationId = `sc_${recipientId}_${Date.now()}`;

      const conversation: SecretConversation = {
        id: conversationId,
        recipientId,
        recipientName,
        sessionId: session.sessionId,
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
      };

      // Notify server of the new session
      await secretChatService.createSession({
        recipientId,
        conversationId,
        sessionId: session.sessionId,
      });

      const conversations = [...get().conversations, conversation];
      const messages = { ...get().messages, [conversationId]: [] };

      set({ conversations, messages, isLoading: false });
      await persistConversations(conversations);
      await persistMessages(messages);

      return conversationId;
    } catch (error) {
      logger.error('Failed to create secret chat session', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // ─── Send Message ──────────────────────────────────────────────────
  sendMessage: async (conversationId: string, text: string) => {
    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Encrypt with PQXDH session
    const ratchetMsg = await encryptMessage(conversation.sessionId, text);
    const ciphertextB64 = Buffer.from(JSON.stringify(ratchetMsg)).toString('base64');

    const message: SecretMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      senderId: 'self',
      ciphertext: ciphertextB64,
      plaintext: text,
      timestamp: Date.now(),
      isOwn: true,
    };

    // Relay encrypted message to server
    await secretChatService.relayMessage({
      conversationId,
      recipientId: conversation.recipientId,
      ciphertext: ciphertextB64,
      messageId: message.id,
    });

    const msgs = [...(get().messages[conversationId] ?? []), message];
    const messages = { ...get().messages, [conversationId]: msgs };
    const conversations = get().conversations.map((c) =>
      c.id === conversationId ? { ...c, lastMessageAt: Date.now() } : c
    );

    set({ messages, conversations });
    await persistMessages(messages);
    await persistConversations(conversations);
  },

  // ─── Receive Message ───────────────────────────────────────────────
  receiveMessage: async (msg) => {
    const conversation = get().conversations.find((c) => c.id === msg.conversationId);
    if (!conversation) {
      logger.warn('Received message for unknown conversation', msg.conversationId);
      return;
    }

    // Decrypt with PQXDH session
    const ciphertextJson = Buffer.from(msg.ciphertext, 'base64').toString('utf-8');
     
    const ratchetMsg = JSON.parse(ciphertextJson) as TripleRatchetMessage;
    const plaintext = await decryptMessage(conversation.sessionId, ratchetMsg);

    const message: SecretMessage = {
      id: msg.messageId,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      ciphertext: msg.ciphertext,
      plaintext,
      timestamp: msg.timestamp,
      isOwn: false,
    };

    const msgs = [...(get().messages[msg.conversationId] ?? []), message];
    const messages = { ...get().messages, [msg.conversationId]: msgs };
    const conversations = get().conversations.map((c) =>
      c.id === msg.conversationId ? { ...c, lastMessageAt: msg.timestamp } : c
    );

    set({ messages, conversations });
    await persistMessages(messages);
    await persistConversations(conversations);
  },

  // ─── Theme ─────────────────────────────────────────────────────────
  setTheme: async (themeId: SecretThemeId) => {
    set({ activeTheme: themeId });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, themeId);
    } catch {
      logger.error('Failed to persist secret theme');
    }
  },

  // ─── Ghost Mode ────────────────────────────────────────────────────
  enableGhostMode: (seconds: number | null) => {
    clearGhostInterval();

    if (seconds === null || seconds <= 0) {
      set({ ghostModeTimer: null });
      return;
    }

    set({ ghostModeTimer: seconds });

    ghostInterval = setInterval(() => {
      const current = get().ghostModeTimer;
      if (current === null || current <= 1) {
        clearGhostInterval();
        // Auto-delete messages when ghost mode expires
        const activeId = get().activeConversationId;
        if (activeId) {
          const messages = { ...get().messages, [activeId]: [] };
          set({ ghostModeTimer: null, messages });
          void persistMessages(messages);
        } else {
          set({ ghostModeTimer: null });
        }
        return;
      }
      set({ ghostModeTimer: current - 1 });
    }, 1000);
  },

  // ─── Panic Wipe ────────────────────────────────────────────────────
  panicWipe: async () => {
    set({ isLoading: true });

    try {
      // 1. Signal server to wipe all secret chat data
      await secretChatService.panicWipe().catch(() => {
        logger.warn('Server wipe request failed — continuing local wipe');
      });

      // 2. Close all crypto sessions
      await closeAllSessions();

      // 3. Clear all local storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_CONVERSATIONS),
        AsyncStorage.removeItem(STORAGE_KEY_MESSAGES),
        AsyncStorage.removeItem(STORAGE_KEY_THEME),
      ]);

      // 4. Clear ghost mode
      clearGhostInterval();

      // 5. Reset store state
      set({
        conversations: [],
        messages: {},
        activeConversationId: null,
        activeTheme: 'void',
        ghostModeTimer: null,
        isLoading: false,
      });

      logger.info('Panic wipe complete — all secret chat data destroyed');
    } catch (error) {
      logger.error('Panic wipe failed', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // ─── Navigation ────────────────────────────────────────────────────
  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id });
  },

  deleteConversation: async (id: string) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (conversation) {
      await closeSession(conversation.sessionId).catch(() => {});
    }

    const conversations = get().conversations.filter((c) => c.id !== id);
    const messages = { ...get().messages };
    delete messages[id];

    set({ conversations, messages });
    if (get().activeConversationId === id) {
      set({ activeConversationId: null });
    }

    await persistConversations(conversations);
    await persistMessages(messages);
  },

  reset: () => {
    clearGhostInterval();
    set({
      conversations: [],
      messages: {},
      activeConversationId: null,
      activeTheme: 'void',
      ghostModeTimer: null,
      isLoading: false,
    });
  },
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select sorted conversations (most recent first). */
export const useSecretConversations = () =>
  useSecretChatStore((s) => [...s.conversations].sort((a, b) => b.lastMessageAt - a.lastMessageAt));

/** Select messages for the active conversation. */
export const useActiveMessages = () =>
  useSecretChatStore((s) =>
    s.activeConversationId ? (s.messages[s.activeConversationId] ?? []) : []
  );

/** Select the active theme ID. */
export const useSecretTheme = () => useSecretChatStore((s) => s.activeTheme);

/** Select ghost mode timer value. */
export const useGhostModeTimer = () => useSecretChatStore((s) => s.ghostModeTimer);

/** Check if ghost mode is active. */
export const useIsGhostModeActive = () => useSecretChatStore((s) => s.ghostModeTimer !== null);
