/**
 * Tests for API data normalizers
 *
 * These normalizers are critical for ensuring reliable data flow between
 * the Elixir backend (snake_case) and the React frontend (camelCase).
 * They handle: message normalization (6+ content types, media URL resolution,
 * E2EE fields), participant/conversation normalization, and format coercion.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveMediaUrl,
  normalizeMessage,
  normalizeParticipant,
  normalizeConversation,
  normalizeConversations,
} from '../normalizers';

// ===========================================================================
// resolveMediaUrl
// ===========================================================================

describe('resolveMediaUrl', () => {
  it('returns undefined for null/undefined/empty', () => {
    expect(resolveMediaUrl(null)).toBeUndefined();
    expect(resolveMediaUrl(undefined)).toBeUndefined();
    expect(resolveMediaUrl('')).toBeUndefined();
  });

  it('passes absolute http URLs through', () => {
    expect(resolveMediaUrl('https://cdn.example.com/img.png')).toBe(
      'https://cdn.example.com/img.png'
    );
  });

  it('passes data: URLs through', () => {
    expect(resolveMediaUrl('data:image/png;base64,iVBOR')).toBe('data:image/png;base64,iVBOR');
  });

  it('prefixes relative paths with API_URL', () => {
    const result = resolveMediaUrl('/uploads/voice/abc.opus');
    // Should start with http and end with the relative path
    expect(result).toMatch(/^https?:\/\/.+\/uploads\/voice\/abc\.opus$/);
  });

  it('handles relative paths without leading slash', () => {
    const result = resolveMediaUrl('uploads/avatar.jpg');
    expect(result).toContain('/uploads/avatar.jpg');
  });
});

// ===========================================================================
// normalizeMessage — camelCase input
// ===========================================================================

describe('normalizeMessage', () => {
  describe('basic fields (camelCase input)', () => {
    it('normalizes a standard text message', () => {
      const raw = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello!',
        contentType: 'text',
        isEdited: false,
        isPinned: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        reactions: [],
        sender: {
          id: 'user-1',
          username: 'alice',
          displayName: 'Alice',
          avatarUrl: 'https://cdn.example.com/alice.jpg',
          status: 'online',
        },
      };

      const msg = normalizeMessage(raw);

      expect(msg.id).toBe('msg-1');
      expect(msg.conversationId).toBe('conv-1');
      expect(msg.senderId).toBe('user-1');
      expect(msg.content).toBe('Hello!');
      expect(msg.contentType).toBe('text');
      expect(msg.isEdited).toBe(false);
      expect(msg.isPinned).toBe(false);
      expect((msg.sender as Record<string, unknown>)?.username).toBe('alice');
    });
  });

  describe('basic fields (snake_case input)', () => {
    it('converts snake_case backend response to camelCase', () => {
      const raw = {
        id: 'msg-2',
        conversation_id: 'conv-2',
        sender_id: 'user-2',
        content: 'Hi there',
        content_type: 'text',
        message_type: 'text',
        is_edited: true,
        is_pinned: true,
        is_encrypted: false,
        reply_to_id: 'msg-1',
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        inserted_at: '2024-01-01T00:00:00Z',
        sender: {
          id: 'user-2',
          username: 'bob',
          display_name: 'Bob',
          avatar_url: '/avatars/bob.png',
          avatar_border_id: 'border-gold',
        },
      };

      const msg = normalizeMessage(raw);

      expect(msg.conversationId).toBe('conv-2');
      expect(msg.senderId).toBe('user-2');
      expect(msg.contentType).toBe('text');
      expect(msg.messageType).toBe('text');
      expect(msg.isEdited).toBe(true);
      expect(msg.isPinned).toBe(true);
      expect(msg.replyToId).toBe('msg-1');
      expect(msg.createdAt).toBe('2024-01-01T00:00:00Z');

      const sender = msg.sender as Record<string, unknown>;
      expect(sender?.displayName).toBe('Bob');
      expect(sender?.avatarUrl).toBe('/avatars/bob.png');
      expect(sender?.avatarBorderId).toBe('border-gold');
    });
  });

  describe('voice/audio messages', () => {
    it('extracts media URL from attachment object', () => {
      const raw = {
        id: 'msg-voice',
        content_type: 'voice',
        attachment: {
          url: '/uploads/voice/abc.opus',
          filename: 'recording.opus',
          size: 12345,
          mime_type: 'audio/opus',
        },
        metadata: { duration: 5.2, waveform: [0.1, 0.5, 0.3] },
      };

      const msg = normalizeMessage(raw);
      const meta = msg.metadata as Record<string, unknown>;

      // URL should be resolved to absolute
      expect(meta.url).toMatch(/\/uploads\/voice\/abc\.opus$/);
      expect(meta.filename).toBe('recording.opus');
      expect(meta.size).toBe(12345);
      expect(meta.duration).toBe(5.2);
    });

    it('falls back to root-level file fields', () => {
      const raw = {
        id: 'msg-audio',
        content_type: 'audio',
        file_url: '/uploads/audio/track.mp3',
        file_name: 'track.mp3',
        file_size: 9999,
        file_mime_type: 'audio/mpeg',
        metadata: {},
      };

      const msg = normalizeMessage(raw);
      const meta = msg.metadata as Record<string, unknown>;

      expect(meta.url).toMatch(/track\.mp3$/);
      expect(meta.filename).toBe('track.mp3');
    });
  });

  describe('file/image messages', () => {
    it('extracts media URL for file messages from attachment', () => {
      const raw = {
        id: 'msg-file',
        content_type: 'file',
        attachment: {
          url: '/uploads/files/doc.pdf',
          filename: 'doc.pdf',
          size: 50000,
          thumbnail_url: '/uploads/thumbs/doc_thumb.png',
        },
        metadata: {},
      };

      const msg = normalizeMessage(raw);
      const meta = msg.metadata as Record<string, unknown>;

      expect(meta.url).toMatch(/doc\.pdf$/);
      expect(meta.thumbnailUrl).toMatch(/doc_thumb\.png$/);
    });

    it('resolves existing metadata URLs to absolute', () => {
      const raw = {
        id: 'msg-img',
        content_type: 'image',
        metadata: {
          url: '/uploads/images/photo.jpg',
          thumbnailUrl: '/uploads/thumbs/photo_sm.jpg',
        },
      };

      const msg = normalizeMessage(raw);
      const meta = msg.metadata as Record<string, unknown>;

      expect(meta.url).toMatch(/^https?:\/\/.+\/uploads\/images\/photo\.jpg$/);
      expect(meta.thumbnailUrl).toMatch(/photo_sm\.jpg$/);
    });
  });

  describe('E2EE fields', () => {
    it('extracts E2EE fields from metadata', () => {
      const raw = {
        id: 'msg-e2ee',
        content_type: 'text',
        is_encrypted: true,
        metadata: {
          ephemeral_public_key: 'eph-key-b64',
          nonce: 'nonce-b64',
          sender_identity_key: 'sender-ik-b64',
        },
      };

      const msg = normalizeMessage(raw);

      expect(msg.isEncrypted).toBe(true);
      expect(msg.ephemeralPublicKey).toBe('eph-key-b64');
      expect(msg.nonce).toBe('nonce-b64');
      expect(msg.senderIdentityKey).toBe('sender-ik-b64');
    });

    it('extracts E2EE fields from root level (camelCase)', () => {
      const raw = {
        id: 'msg-e2ee-2',
        contentType: 'text',
        isEncrypted: true,
        ephemeralPublicKey: 'eph-key',
        nonce: 'nonce-val',
        senderIdentityKey: 'sender-ik',
        metadata: {},
      };

      const msg = normalizeMessage(raw);

      expect(msg.ephemeralPublicKey).toBe('eph-key');
      expect(msg.nonce).toBe('nonce-val');
    });
  });

  describe('edge cases', () => {
    it('returns non-object input as-is', () => {
      expect(normalizeMessage(null as unknown as Record<string, unknown>)).toBeNull();
    });

    it('provides defaults for missing fields', () => {
      const msg = normalizeMessage({ id: 'msg-minimal' });

      expect(msg.content).toBe('');
      expect(msg.contentType).toBe('text');
      expect(msg.isEdited).toBe(false);
      expect(msg.isPinned).toBe(false);
      expect(msg.isEncrypted).toBe(false);
      expect(msg.reactions).toEqual([]);
      expect(msg.createdAt).toBeDefined(); // defaults to new Date().toISOString()
    });

    it('uses inserted_at as createdAt fallback', () => {
      const msg = normalizeMessage({
        id: 'msg-fallback',
        inserted_at: '2024-06-01T12:00:00Z',
      });

      expect(msg.createdAt).toBe('2024-06-01T12:00:00Z');
    });
  });
});

// ===========================================================================
// normalizeParticipant
// ===========================================================================

describe('normalizeParticipant', () => {
  it('normalizes a participant with nested user object', () => {
    const raw = {
      id: 'p-1',
      user_id: 'user-1',
      is_muted: false,
      joined_at: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        username: 'alice',
        display_name: 'Alice',
        avatar_url: '/avatars/alice.png',
        avatar_border_id: 'gold',
        status: 'online',
      },
    };

    const p = normalizeParticipant(raw);

    expect(p.participantId).toBe('p-1');
    expect(p.userId).toBe('user-1');
    expect(p.isMuted).toBe(false);
    expect((p.user as Record<string, unknown>)?.displayName).toBe('Alice');
    expect((p.user as Record<string, unknown>)?.avatarBorderId).toBe('gold');
  });

  it('extracts userId from nested user when user_id is missing', () => {
    const raw = {
      id: 'p-2',
      user: { id: 'user-2', username: 'bob' },
    };

    const p = normalizeParticipant(raw);
    expect(p.userId).toBe('user-2');
  });

  it('returns non-object input as-is', () => {
    expect(normalizeParticipant(null as unknown as Record<string, unknown>)).toBeNull();
  });

  it('sets user to null when no user object exists', () => {
    const p = normalizeParticipant({ id: 'p-3' });
    expect(p.user).toBeNull();
  });
});

// ===========================================================================
// normalizeConversation
// ===========================================================================

describe('normalizeConversation', () => {
  it('normalizes a conversation with participants and last message', () => {
    const raw = {
      id: 'conv-1',
      type: 'direct',
      last_message: {
        id: 'msg-1',
        content: 'Latest',
        content_type: 'text',
        sender: { id: 'u1', username: 'alice' },
      },
      last_message_at: '2024-06-01T12:00:00Z',
      unread_count: 3,
      participants: [
        { id: 'p-1', user: { id: 'u1', username: 'alice', display_name: 'Alice' } },
        { id: 'p-2', user: { id: 'u2', username: 'bob' } },
      ],
      created_at: '2024-01-01T00:00:00Z',
      muted: false,
      pinned: true,
      message_ttl: 86400,
    };

    const conv = normalizeConversation(raw);

    expect(conv.id).toBe('conv-1');
    expect(conv.type).toBe('direct');
    expect(conv.unreadCount).toBe(3);
    expect(conv.pinned).toBe(true);
    expect(conv.messageTTL).toBe(86400);
    expect((conv.lastMessage as Record<string, unknown>)?.content).toBe('Latest');
    expect((conv.participants as unknown[])?.length).toBe(2);
  });

  it('handles conversation with no participants', () => {
    const conv = normalizeConversation({
      id: 'conv-empty',
      participants: null,
    } as unknown as Record<string, unknown>);

    expect(conv.participants).toEqual([]);
  });

  it('provides defaults for missing fields', () => {
    const conv = normalizeConversation({ id: 'conv-minimal' });

    expect(conv.type).toBe('direct');
    expect(conv.unreadCount).toBe(0);
    expect(conv.muted).toBe(false);
    expect(conv.pinned).toBe(false);
    expect(conv.lastMessage).toBeNull();
    expect(conv.participants).toEqual([]);
    expect(conv.messageTTL).toBeNull();
  });

  it('returns non-object input as-is', () => {
    expect(normalizeConversation(null as unknown as Record<string, unknown>)).toBeNull();
  });
});

// ===========================================================================
// normalizeConversations (batch)
// ===========================================================================

describe('normalizeConversations', () => {
  it('normalizes an array of conversations', () => {
    const result = normalizeConversations([
      { id: 'c1', type: 'direct' },
      { id: 'c2', type: 'group', name: 'Team' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('c1');
    expect(result[1]!.name).toBe('Team');
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeConversations(null as unknown as unknown[])).toEqual([]);
    expect(normalizeConversations('not an array' as unknown as unknown[])).toEqual([]);
  });
});
