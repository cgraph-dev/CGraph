import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeRemaining, getQuestTypeColor, isQuestReady, getQuestProgress } from '../utils';

describe('formatTimeRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Expired" for past dates', () => {
    expect(formatTimeRemaining('2025-06-14T00:00:00Z')).toBe('Expired');
  });

  it('formats hours and minutes', () => {
    const result = formatTimeRemaining('2025-06-15T15:30:00Z');
    expect(result).toBe('3h 30m');
  });

  it('formats days and hours', () => {
    const result = formatTimeRemaining('2025-06-18T12:00:00Z');
    expect(result).toBe('3d 0h');
  });
});

describe('getQuestTypeColor', () => {
  it('returns blue classes for daily', () => {
    const color = getQuestTypeColor('daily');
    expect(color.bg).toContain('blue');
    expect(color.text).toContain('blue');
  });

  it('returns purple classes for weekly', () => {
    const color = getQuestTypeColor('weekly');
    expect(color.bg).toContain('purple');
  });

  it('returns orange classes for monthly', () => {
    const color = getQuestTypeColor('monthly');
    expect(color.bg).toContain('orange');
  });

  it('returns pink classes for special', () => {
    const color = getQuestTypeColor('special');
    expect(color.bg).toContain('pink');
  });

  it('returns gray classes for unknown type', () => {
    const color = getQuestTypeColor('unknown');
    expect(color.bg).toContain('gray');
  });
});

describe('isQuestReady', () => {
  it('returns true when all objectives complete', () => {
    const quest = {
      objectives: [
        { completed: true, currentValue: 10, targetValue: 10 },
        { completed: true, currentValue: 5, targetValue: 5 },
      ],
    };
    expect(isQuestReady(quest as never)).toBe(true);
  });

  it('returns false when some objectives incomplete', () => {
    const quest = {
      objectives: [
        { completed: true, currentValue: 10, targetValue: 10 },
        { completed: false, currentValue: 3, targetValue: 5 },
      ],
    };
    expect(isQuestReady(quest as never)).toBe(false);
  });

  it('returns true for empty objectives', () => {
    const quest = { objectives: [] };
    expect(isQuestReady(quest as never)).toBe(true);
  });
});

describe('getQuestProgress', () => {
  it('returns 0 for empty objectives', () => {
    const quest = { objectives: [] };
    expect(getQuestProgress(quest as never)).toBe(0);
  });

  it('returns 100 for fully completed quest', () => {
    const quest = {
      objectives: [
        { currentValue: 10, targetValue: 10 },
        { currentValue: 5, targetValue: 5 },
      ],
    };
    expect(getQuestProgress(quest as never)).toBe(100);
  });

  it('returns partial progress', () => {
    const quest = {
      objectives: [{ currentValue: 5, targetValue: 10 }],
    };
    expect(getQuestProgress(quest as never)).toBe(50);
  });

  it('caps at 100', () => {
    const quest = {
      objectives: [{ currentValue: 20, targetValue: 10 }],
    };
    expect(getQuestProgress(quest as never)).toBeLessThanOrEqual(100);
  });
});
