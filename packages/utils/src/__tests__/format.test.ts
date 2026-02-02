import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatMessageTime,
  formatRelativeTime,
  formatDateHeader,
  formatFileSize,
  formatNumber,
  formatDuration,
  truncate,
  formatWalletAddress,
  pluralize,
} from '../format';

describe('format utilities', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should format with decimal precision', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers under 1000', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(10000)).toBe('10K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });

    it('should format billions with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1B');
      expect(formatNumber(7500000000)).toBe('7.5B');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(120)).toBe('2m');
    });

    it('should format minutes with seconds', () => {
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
    });

    it('should format hours', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7325)).toBe('2:02:05');
    });
  });

  describe('truncate', () => {
    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncate('Hello World!', 10)).toBe('Hello W...');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  describe('formatWalletAddress', () => {
    it('should not truncate short addresses', () => {
      expect(formatWalletAddress('0x1234567890')).toBe('0x1234567890');
    });

    it('should truncate long addresses', () => {
      expect(formatWalletAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
        '0x1234...5678'
      );
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize(1, 'item')).toBe('item');
      expect(pluralize(1, 'person', 'people')).toBe('person');
    });

    it('should return plural for count other than 1', () => {
      expect(pluralize(0, 'item')).toBe('items');
      expect(pluralize(2, 'item')).toBe('items');
      expect(pluralize(100, 'item')).toBe('items');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'person', 'people')).toBe('people');
      expect(pluralize(5, 'child', 'children')).toBe('children');
    });
  });

  describe('formatMessageTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-02T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format today times', () => {
      const result = formatMessageTime('2026-02-02T10:30:00Z');
      // The time will be formatted in local timezone, so just check it has time format
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should format yesterday times', () => {
      const result = formatMessageTime('2026-02-01T10:30:00Z');
      expect(result).toContain('Yesterday');
    });

    it('should format older dates', () => {
      const result = formatMessageTime('2026-01-15T10:30:00Z');
      expect(result).toContain('Jan 15, 2026');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-02T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format just now', () => {
      const result = formatRelativeTime('2026-02-02T12:00:00Z');
      expect(result).toBe('now');
    });

    it('should format minutes ago', () => {
      const result = formatRelativeTime('2026-02-02T11:45:00Z');
      expect(result).toBe('15m');
    });

    it('should format hours ago', () => {
      const result = formatRelativeTime('2026-02-02T09:00:00Z');
      expect(result).toBe('3h');
    });

    it('should format days ago', () => {
      const result = formatRelativeTime('2026-01-30T12:00:00Z');
      expect(result).toBe('3d');
    });

    it('should format weeks ago', () => {
      const result = formatRelativeTime('2026-01-19T12:00:00Z');
      expect(result).toBe('2w');
    });
  });

  describe('formatDateHeader', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-02T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format today', () => {
      expect(formatDateHeader('2026-02-02T10:00:00Z')).toBe('Today');
    });

    it('should format yesterday', () => {
      expect(formatDateHeader('2026-02-01T10:00:00Z')).toBe('Yesterday');
    });

    it('should format older dates', () => {
      expect(formatDateHeader('2026-01-15T10:00:00Z')).toBe('January 15, 2026');
    });
  });
});
