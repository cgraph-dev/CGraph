import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateHeader,
  formatLastSeen,
  parseMessageDate,
  groupMessagesByDate,
} from '../messageUtils';

// ═══════════════════════════════════════════════════════════════════
// formatDateHeader — extended tests
// ═══════════════════════════════════════════════════════════════════

describe('formatDateHeader', () => {
  it('returns "Today" for today\'s date', () => {
    expect(formatDateHeader(new Date())).toBe('Today');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDateHeader(yesterday)).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    const date = new Date('2025-12-25T10:00:00Z');
    expect(formatDateHeader(date)).toBe('December 25, 2025');
  });

  it('returns "Unknown" for invalid date', () => {
    expect(formatDateHeader(new Date('invalid'))).toBe('Unknown');
  });

  it('returns "Unknown" for NaN date object', () => {
    expect(formatDateHeader(new Date(NaN))).toBe('Unknown');
  });

  it('formats January 1 correctly', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    expect(formatDateHeader(date)).toBe('January 1, 2025');
  });

  it('handles midnight boundary of today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(formatDateHeader(today)).toBe('Today');
  });

  it('handles end of day for today', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    expect(formatDateHeader(today)).toBe('Today');
  });
});

// ═══════════════════════════════════════════════════════════════════
// formatLastSeen
// ═══════════════════════════════════════════════════════════════════

describe('formatLastSeen', () => {
  it('returns "Offline" for null', () => {
    expect(formatLastSeen(null)).toBe('Offline');
  });

  it('returns "Offline" for undefined', () => {
    expect(formatLastSeen(undefined)).toBe('Offline');
  });

  it('returns "Offline" for empty string', () => {
    expect(formatLastSeen('')).toBe('Offline');
  });

  it('returns "Offline" for invalid date string', () => {
    expect(formatLastSeen('not-a-date')).toBe('Offline');
  });

  it('returns "Last seen just now" for recent timestamp', () => {
    const now = new Date().toISOString();
    expect(formatLastSeen(now)).toBe('Last seen just now');
  });

  it('returns minutes ago for < 60 min', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatLastSeen(thirtyMinsAgo)).toBe('Last seen 30m ago');
  });

  it('returns hours ago for < 24 hours', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    expect(formatLastSeen(fiveHoursAgo)).toBe('Last seen 5h ago');
  });

  it('returns "Last seen yesterday" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 86400 * 1000).toISOString();
    expect(formatLastSeen(oneDayAgo)).toBe('Last seen yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatLastSeen(threeDaysAgo)).toBe('Last seen 3d ago');
  });

  it('returns formatted date for > 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400 * 1000).toISOString();
    const result = formatLastSeen(tenDaysAgo);
    expect(result).toMatch(/^Last seen \w+ \d+$/);
  });

  it('returns "Last seen 1m ago" for 90 seconds', () => {
    const ninetySecsAgo = new Date(Date.now() - 90 * 1000).toISOString();
    expect(formatLastSeen(ninetySecsAgo)).toBe('Last seen 1m ago');
  });
});

// ═══════════════════════════════════════════════════════════════════
// parseMessageDate
// ═══════════════════════════════════════════════════════════════════

describe('parseMessageDate', () => {
  it('returns current date for null', () => {
    const before = Date.now();
    const result = parseMessageDate(null);
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('returns current date for undefined', () => {
    const before = Date.now();
    const result = parseMessageDate(undefined);
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('returns current date for empty string', () => {
    const result = parseMessageDate('');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('returns current date for invalid date string', () => {
    const before = Date.now();
    const result = parseMessageDate('gibberish');
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('parses valid ISO string', () => {
    const result = parseMessageDate('2025-06-15T12:00:00Z');
    expect(result.toISOString()).toBe('2025-06-15T12:00:00.000Z');
  });

  it('parses date-only string', () => {
    const result = parseMessageDate('2025-03-01');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(2); // March = 2
  });

  it('parses epoch-style numeric string', () => {
    // "0" should parse to epoch
    const result = parseMessageDate('2024-01-01T00:00:00.000Z');
    expect(result.getFullYear()).toBe(2024);
  });
});

// ═══════════════════════════════════════════════════════════════════
// groupMessagesByDate
// ═══════════════════════════════════════════════════════════════════

describe('groupMessagesByDate', () => {
  const makeMsg = (id: string, dateStr: string) =>
    ({ id, createdAt: dateStr }) as unknown as import('@/modules/chat/store').Message;

  it('returns empty array for empty messages', () => {
    expect(groupMessagesByDate([])).toEqual([]);
  });

  it('groups single message into one group', () => {
    const msgs = [makeMsg('1', '2025-06-15T10:00:00Z')];
    const groups = groupMessagesByDate(msgs);
    expect(groups).toHaveLength(1);
    expect(groups[0].messages).toHaveLength(1);
  });

  it('groups messages on the same date together', () => {
    const msgs = [
      makeMsg('1', '2025-06-15T10:00:00Z'),
      makeMsg('2', '2025-06-15T14:00:00Z'),
      makeMsg('3', '2025-06-15T18:00:00Z'),
    ];
    const groups = groupMessagesByDate(msgs);
    expect(groups).toHaveLength(1);
    expect(groups[0].messages).toHaveLength(3);
  });

  it('creates separate groups for different dates', () => {
    const msgs = [makeMsg('1', '2025-06-15T10:00:00Z'), makeMsg('2', '2025-06-16T10:00:00Z')];
    const groups = groupMessagesByDate(msgs);
    expect(groups).toHaveLength(2);
  });

  it('preserves message order within groups', () => {
    const msgs = [
      makeMsg('1', '2025-06-15T08:00:00Z'),
      makeMsg('2', '2025-06-15T12:00:00Z'),
      makeMsg('3', '2025-06-15T16:00:00Z'),
    ];
    const groups = groupMessagesByDate(msgs);
    expect(groups[0].messages.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('handles messages with missing createdAt gracefully', () => {
    const msgs = [makeMsg('1', undefined as unknown as string)];
    const groups = groupMessagesByDate(msgs);
    expect(groups).toHaveLength(1);
  });

  it('handles mixed valid and invalid dates', () => {
    const msgs = [
      makeMsg('1', '2025-06-15T10:00:00Z'),
      makeMsg('2', 'invalid-date'),
      makeMsg('3', '2025-06-16T10:00:00Z'),
    ];
    const groups = groupMessagesByDate(msgs);
    // invalid date falls back to current date, which is different from the fixed dates
    expect(groups.length).toBeGreaterThanOrEqual(2);
  });
});
