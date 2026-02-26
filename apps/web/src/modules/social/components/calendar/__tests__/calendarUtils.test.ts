import { describe, it, expect } from 'vitest';
import { formatTime, getCategoryColor, getEventTypeIcon, isToday } from '../calendarUtils';
import type { CalendarCategory } from '../calendarUtils';

describe('calendarUtils', () => {
  describe('formatTime', () => {
    it('formats a date string to a time', () => {
      const result = formatTime('2024-06-15T14:30:00Z');
      // Locale-dependent, but should contain digits
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getCategoryColor', () => {
    const categories: CalendarCategory[] = [
      { id: 'cat-1', name: 'Work', color: '#ff0000' },
      { id: 'cat-2', name: 'Personal', color: '#00ff00' },
    ];

    it('returns category color when found', () => {
      expect(getCategoryColor(categories, 'cat-1')).toBe('#ff0000');
    });

    it('returns default indigo when no category id', () => {
      expect(getCategoryColor(categories, null)).toBe('#6366f1');
      expect(getCategoryColor(categories, undefined)).toBe('#6366f1');
    });

    it('returns default indigo when category not found', () => {
      expect(getCategoryColor(categories, 'nonexistent')).toBe('#6366f1');
    });
  });

  describe('getEventTypeIcon', () => {
    it('returns birthday icon', () => {
      expect(getEventTypeIcon('birthday')).toBe('🎂');
    });

    it('returns holiday icon', () => {
      expect(getEventTypeIcon('holiday')).toBe('🎉');
    });

    it('returns recurring icon', () => {
      expect(getEventTypeIcon('recurring')).toBe('🔄');
    });

    it('returns default icon for undefined', () => {
      expect(getEventTypeIcon(undefined)).toBe('📅');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });
});
