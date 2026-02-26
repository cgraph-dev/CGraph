import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveScheduleDate,
  formatDateTimeLocal,
  formatTimeUntil,
  QUICK_SCHEDULE_OPTIONS,
} from '../scheduleMessageUtils';

describe('scheduleMessageUtils', () => {
  describe('QUICK_SCHEDULE_OPTIONS', () => {
    it('exports an array of options with required fields', () => {
      expect(QUICK_SCHEDULE_OPTIONS).toBeInstanceOf(Array);
      expect(QUICK_SCHEDULE_OPTIONS.length).toBeGreaterThan(0);
      for (const opt of QUICK_SCHEDULE_OPTIONS) {
        expect(opt).toHaveProperty('label');
        expect(opt).toHaveProperty('duration');
        expect(opt).toHaveProperty('icon');
      }
    });
  });

  describe('resolveScheduleDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // 2024-06-15 14:00:00
      vi.setSystemTime(new Date(2024, 5, 15, 14, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds hours to current time', () => {
      const date = resolveScheduleDate(QUICK_SCHEDULE_OPTIONS[0]!); // 1 hour
      expect(date.getHours()).toBe(15);
    });

    it('handles option with specific time', () => {
      const opt = QUICK_SCHEDULE_OPTIONS[2]!; // Tomorrow 9am
      const date = resolveScheduleDate(opt);
      expect(date.getHours()).toBe(9);
      expect(date.getMinutes()).toBe(0);
    });

    it('returns a Date object', () => {
      const date = resolveScheduleDate(QUICK_SCHEDULE_OPTIONS[0]!);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('formatDateTimeLocal', () => {
    it('formats date as datetime-local value', () => {
      const date = new Date(2024, 5, 15, 14, 30, 0);
      const result = formatDateTimeLocal(date);
      expect(result).toBe('2024-06-15T14:30');
    });
  });

  describe('formatTimeUntil', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15, 14, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats hours and minutes', () => {
      const target = new Date(2024, 5, 15, 17, 30, 0); // 3h 30m later
      const result = formatTimeUntil(target);
      expect(result).toContain('3 hours');
      expect(result).toContain('30 minutes');
    });

    it('shows days for 24+ hours', () => {
      const target = new Date(2024, 5, 18, 14, 0, 0); // 3 days later
      const result = formatTimeUntil(target);
      expect(result).toContain('3 days');
    });

    it('handles singular forms', () => {
      const target = new Date(2024, 5, 15, 15, 1, 0); // 1h 1m
      const result = formatTimeUntil(target);
      expect(result).toContain('1 hour ');
      expect(result).toContain('1 minute');
    });
  });
});
