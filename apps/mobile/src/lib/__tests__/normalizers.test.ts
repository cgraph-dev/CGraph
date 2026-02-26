/**
 * Tests for normalizers — message/sender normalization and media URL resolution.
 *
 * @module lib/__tests__/normalizers.test
 */

import { normalizeMessage, normalizeMessages } from '../normalizers';

// Mock the api module's API_URL export
jest.mock('../api', () => ({
  API_URL: 'https://api.cgraph.test',
  __esModule: true,
  default: {},
}));

// ── resolveMediaUrl (tested through normalizeMessage) ────────────────

describe('normalizeMessage — media URL resolution', () => {
  it('resolves relative URL to absolute using API_URL', () => {
    const raw = {
      id: 'msg-1',
      content: '',
      metadata: { url: '/uploads/voice/abc.opus' },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBe('https://api.cgraph.test/uploads/voice/abc.opus');
  });

  it('preserves absolute http URL unchanged', () => {
    const raw = {
      id: 'msg-2',
      content: '',
      metadata: { url: 'https://cdn.example.com/file.png' },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBe('https://cdn.example.com/file.png');
  });

  it('preserves data: URL unchanged', () => {
    const raw = {
      id: 'msg-3',
      content: '',
      metadata: { url: 'data:image/png;base64,abc123' },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBe('data:image/png;base64,abc123');
  });

  it('handles null/undefined metadata url gracefully', () => {
    const raw = { id: 'msg-4', content: 'hello' };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBeUndefined();
  });
});

// ── normalizeMessage — field mapping ────────────────────────────────

describe('normalizeMessage — field mapping', () => {
  it('maps basic snake_case fields', () => {
    const raw = {
      id: 'msg-10',
      content: 'test message',
      sender_id: 'user-1',
      conversation_id: 'conv-1',
      reply_to_id: 'msg-9',
      is_edited: true,
      is_deleted: false,
      is_pinned: false,
      inserted_at: '2024-01-15T12:00:00Z',
      updated_at: '2024-01-15T12:01:00Z',
    };
    const result = normalizeMessage(raw);
    expect(result.id).toBe('msg-10');
    expect(result.content).toBe('test message');
    expect(result.sender_id).toBe('user-1');
    expect(result.conversation_id).toBe('conv-1');
    expect(result.reply_to_id).toBe('msg-9');
    expect(result.is_edited).toBe(true);
    expect(result.is_deleted).toBe(false);
    expect(result.is_pinned).toBe(false);
    expect(result.inserted_at).toBe('2024-01-15T12:00:00Z');
    expect(result.updated_at).toBe('2024-01-15T12:01:00Z');
  });

  it('maps camelCase fields from WebSocket data', () => {
    const raw = {
      id: 'msg-11',
      content: 'ws message',
      senderId: 'user-2',
      conversationId: 'conv-2',
      replyToId: 'msg-10',
      isEdited: false,
      isDeleted: true,
      isPinned: true,
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T12:05:00Z',
    };
    const result = normalizeMessage(raw);
    expect(result.sender_id).toBe('user-2');
    expect(result.conversation_id).toBe('conv-2');
    expect(result.reply_to_id).toBe('msg-10');
    expect(result.is_edited).toBe(false);
    expect(result.is_deleted).toBe(true);
    expect(result.is_pinned).toBe(true);
  });

  it('defaults content to empty string when missing', () => {
    const raw = { id: 'msg-12' };
    const result = normalizeMessage(raw);
    expect(result.content).toBe('');
  });

  it('defaults type to "text" when missing', () => {
    const raw = { id: 'msg-13', content: 'hi' };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('text');
  });

  it('defaults reactions to empty array', () => {
    const raw = { id: 'msg-14', content: 'hi' };
    const result = normalizeMessage(raw);
    expect(result.reactions).toEqual([]);
  });

  it('defaults attachments to empty array', () => {
    const raw = { id: 'msg-15', content: 'hi' };
    const result = normalizeMessage(raw);
    expect(result.attachments).toEqual([]);
  });

  it('defaults is_edited/is_deleted/is_pinned to false', () => {
    const raw = { id: 'msg-16', content: 'hi' };
    const result = normalizeMessage(raw);
    expect(result.is_edited).toBe(false);
    expect(result.is_deleted).toBe(false);
    expect(result.is_pinned).toBe(false);
  });
});

// ── normalizeMessage — type detection ────────────────────────────────

describe('normalizeMessage — type detection', () => {
  it('detects video from MIME type when type is "image"', () => {
    const raw = {
      id: 'msg-20',
      content: '',
      type: 'image',
      fileMimeType: 'video/mp4',
    };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('video');
  });

  it('detects video from file extension when type is "text"', () => {
    const raw = {
      id: 'msg-21',
      content: '',
      type: 'text',
      fileUrl: '/uploads/video/clip.mp4',
    };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('video');
  });

  it('detects audio from MIME type', () => {
    const raw = {
      id: 'msg-22',
      content: '',
      type: 'text',
      fileMimeType: 'audio/mpeg',
    };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('audio');
  });

  it('preserves voice type when already set', () => {
    const raw = {
      id: 'msg-23',
      content: '',
      type: 'voice',
      fileMimeType: 'audio/opus',
    };
    const result = normalizeMessage(raw);
    // voice type should not be overridden to "audio"
    expect(result.type).toBe('voice');
  });

  it('preserves explicit video type', () => {
    const raw = {
      id: 'msg-24',
      content: '',
      type: 'video',
    };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('video');
  });

  it('detects video from .webm extension', () => {
    const raw = {
      id: 'msg-25',
      content: '',
      type: 'image',
      metadata: { url: '/uploads/clip.webm' },
    };
    const result = normalizeMessage(raw);
    expect(result.type).toBe('video');
  });
});

// ── normalizeMessage — sender extraction ─────────────────────────────

describe('normalizeMessage — sender extraction', () => {
  it('normalizes sender with all fields', () => {
    const raw = {
      id: 'msg-30',
      content: '',
      sender: {
        id: 'user-5',
        username: 'alice',
        displayName: 'Alice Wonderland',
        avatarUrl: '/avatars/alice.png',
        status: 'online',
        karma: 100,
        isVerified: true,
      },
    };
    const result = normalizeMessage(raw);
    expect(result.sender.id).toBe('user-5');
    expect(result.sender.username).toBe('alice');
    expect(result.sender.display_name).toBe('Alice Wonderland');
    expect(result.sender.avatar_url).toBe('/avatars/alice.png');
    expect(result.sender.status).toBe('online');
    expect(result.sender.karma).toBe(100);
    expect(result.sender.is_verified).toBe(true);
  });

  it('returns default sender for null sender', () => {
    const raw = { id: 'msg-31', content: '', sender: null };
    const result = normalizeMessage(raw);
    expect(result.sender.id).toBe('');
    expect(result.sender.username).toBeNull();
    expect(result.sender.status).toBe('offline');
  });

  it('returns default sender when sender is missing', () => {
    const raw = { id: 'msg-32', content: '' };
    const result = normalizeMessage(raw);
    expect(result.sender.id).toBe('');
    expect(result.sender.display_name).toBeNull();
  });

  it('extracts sender_id from sender object as fallback', () => {
    const raw = {
      id: 'msg-33',
      content: '',
      sender: { id: 'user-7', username: 'bob' },
    };
    const result = normalizeMessage(raw);
    expect(result.sender_id).toBe('user-7');
  });

  it('normalizes sender with snake_case fields', () => {
    const raw = {
      id: 'msg-34',
      content: '',
      sender: {
        id: 'user-8',
        username: 'charlie',
        display_name: 'Charlie B',
        avatar_url: '/avatars/charlie.png',
        is_verified: true,
      },
    };
    const result = normalizeMessage(raw);
    expect(result.sender.display_name).toBe('Charlie B');
    expect(result.sender.avatar_url).toBe('/avatars/charlie.png');
    expect(result.sender.is_verified).toBe(true);
  });
});

// ── normalizeMessage — metadata from attachment ──────────────────────

describe('normalizeMessage — metadata from attachment', () => {
  it('extracts metadata from attachment object when metadata missing', () => {
    const raw = {
      id: 'msg-40',
      content: '',
      attachment: {
        url: '/uploads/files/doc.pdf',
        filename: 'document.pdf',
        size: 1024,
        mime_type: 'application/pdf',
      },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBe('https://api.cgraph.test/uploads/files/doc.pdf');
    expect(result.metadata?.filename).toBe('document.pdf');
    expect(result.metadata?.size).toBe(1024);
    expect(result.metadata?.mimeType).toBe('application/pdf');
  });

  it('extracts metadata from root-level file fields', () => {
    const raw = {
      id: 'msg-41',
      content: '',
      fileUrl: '/uploads/photos/pic.jpg',
      fileName: 'pic.jpg',
      fileSize: 2048,
      fileMimeType: 'image/jpeg',
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.url).toBe('https://api.cgraph.test/uploads/photos/pic.jpg');
    expect(result.metadata?.filename).toBe('pic.jpg');
    expect(result.metadata?.size).toBe(2048);
  });

  it('prefers metadata object over attachment/root fields', () => {
    const raw = {
      id: 'msg-42',
      content: '',
      metadata: { url: '/uploads/voice/msg.opus', duration: 5.3 },
      attachment: { url: '/uploads/old/msg.opus' },
      fileUrl: '/uploads/oldest/msg.opus',
    };
    const result = normalizeMessage(raw);
    // metadata.url takes priority
    expect(result.metadata?.url).toBe('https://api.cgraph.test/uploads/voice/msg.opus');
    expect(result.metadata?.duration).toBe(5.3);
  });

  it('resolves thumbnail URLs', () => {
    const raw = {
      id: 'msg-43',
      content: '',
      metadata: {
        url: 'https://cdn.example.com/video.mp4',
        thumbnailUrl: '/uploads/thumbs/thumb.jpg',
      },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.thumbnail).toBe('https://api.cgraph.test/uploads/thumbs/thumb.jpg');
  });

  it('resolves grid_images URLs', () => {
    const raw = {
      id: 'msg-44',
      content: '',
      metadata: {
        url: 'https://cdn.example.com/gallery',
        grid_images: ['/uploads/img1.jpg', 'https://cdn.example.com/img2.jpg'],
        image_count: 2,
      },
    };
    const result = normalizeMessage(raw);
    expect(result.metadata?.grid_images).toEqual([
      'https://api.cgraph.test/uploads/img1.jpg',
      'https://cdn.example.com/img2.jpg',
    ]);
    expect(result.metadata?.image_count).toBe(2);
  });
});

// ── normalizeMessage — reply_to recursion ───────────────────────────

describe('normalizeMessage — reply_to', () => {
  it('normalizes nested reply_to message (snake_case)', () => {
    const raw = {
      id: 'msg-50',
      content: 'reply',
      reply_to: { id: 'msg-49', content: 'original', sender_id: 'user-1' },
    };
    const result = normalizeMessage(raw);
    expect(result.reply_to).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.reply_to!.id).toBe('msg-49');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.reply_to!.content).toBe('original');
  });

  it('normalizes nested replyTo message (camelCase)', () => {
    const raw = {
      id: 'msg-51',
      content: 'reply',
      replyTo: { id: 'msg-50', content: 'parent' },
    };
    const result = normalizeMessage(raw);
    expect(result.reply_to).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.reply_to!.id).toBe('msg-50');
  });

  it('sets reply_to to undefined when not present', () => {
    const raw = { id: 'msg-52', content: 'standalone' };
    const result = normalizeMessage(raw);
    expect(result.reply_to).toBeUndefined();
  });
});

// ── normalizeMessages ───────────────────────────────────────────────

describe('normalizeMessages', () => {
  it('normalizes an array of raw messages', () => {
    const raw = [
      { id: 'msg-60', content: 'first' },
      { id: 'msg-61', content: 'second' },
    ];
    const results = normalizeMessages(raw);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('msg-60');
    expect(results[1].id).toBe('msg-61');
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeMessages(null as unknown as unknown[])).toEqual([]);
    expect(normalizeMessages(undefined as unknown as unknown[])).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(normalizeMessages([])).toEqual([]);
  });
});
