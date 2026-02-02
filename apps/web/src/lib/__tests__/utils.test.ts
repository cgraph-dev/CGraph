import { describe, it, expect } from 'vitest';
import { cn, safeParseDate, formatTimeAgo, formatBytes, getAvatarBorderId } from '../utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isInactive = false;
      expect(cn('base', isActive && 'active')).toBe('base active');
      expect(cn('base', isInactive && 'active')).toBe('base');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });
  });

  describe('safeParseDate', () => {
    it('should parse valid date string', () => {
      const result = safeParseDate('2024-01-15T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should parse timestamp', () => {
      const timestamp = 1705320000000; // 2024-01-15T12:00:00Z
      const result = safeParseDate(timestamp);
      expect(result).toBeInstanceOf(Date);
    });

    it('should parse Date object', () => {
      const date = new Date('2024-01-15');
      const result = safeParseDate(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid date', () => {
      expect(safeParseDate('not-a-date')).toBeNull();
    });

    it('should return null for empty value', () => {
      expect(safeParseDate(null)).toBeNull();
      expect(safeParseDate(undefined)).toBeNull();
      expect(safeParseDate('')).toBeNull();
    });
  });

  describe('formatTimeAgo', () => {
    it('should format recent date', () => {
      const recentDate = new Date(Date.now() - 60000); // 1 minute ago
      const result = formatTimeAgo(recentDate);
      expect(result).toContain('minute');
    });

    it('should return fallback for invalid date', () => {
      expect(formatTimeAgo(null)).toBe('Just now');
      expect(formatTimeAgo('invalid')).toBe('Just now');
    });

    it('should use custom fallback', () => {
      expect(formatTimeAgo(null, { fallback: 'Unknown' })).toBe('Unknown');
    });

    it('should handle addSuffix option', () => {
      const date = new Date(Date.now() - 3600000); // 1 hour ago
      const withSuffix = formatTimeAgo(date, { addSuffix: true });
      const withoutSuffix = formatTimeAgo(date, { addSuffix: false });
      expect(withSuffix).toContain('ago');
      expect(withoutSuffix).not.toContain('ago');
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimals parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB');
    });
  });

  describe('getAvatarBorderId', () => {
    it('should get camelCase avatarBorderId', () => {
      expect(getAvatarBorderId({ avatarBorderId: 'border-1' })).toBe('border-1');
    });

    it('should get snake_case avatar_border_id', () => {
      expect(getAvatarBorderId({ avatar_border_id: 'border-2' })).toBe('border-2');
    });

    it('should prefer camelCase over snake_case', () => {
      expect(
        getAvatarBorderId({
          avatarBorderId: 'camel',
          avatar_border_id: 'snake',
        })
      ).toBe('camel');
    });

    it('should return null for missing property', () => {
      expect(getAvatarBorderId({})).toBeNull();
      expect(getAvatarBorderId({ other: 'value' })).toBeNull();
    });

    it('should return null for non-object', () => {
      expect(getAvatarBorderId(null)).toBeNull();
      expect(getAvatarBorderId(undefined)).toBeNull();
      expect(getAvatarBorderId('string')).toBeNull();
      expect(getAvatarBorderId(123)).toBeNull();
    });

    it('should return null for non-string border id', () => {
      expect(getAvatarBorderId({ avatarBorderId: 123 })).toBeNull();
      expect(getAvatarBorderId({ avatarBorderId: null })).toBeNull();
    });
  });
});
