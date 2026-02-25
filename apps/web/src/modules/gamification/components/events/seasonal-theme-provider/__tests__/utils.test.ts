import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectSeasonalTheme } from '../utils';

describe('detectSeasonalTheme', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "halloween" in October', () => {
    vi.setSystemTime(new Date('2025-10-15T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('halloween');
  });

  it('returns "winter" in December', () => {
    vi.setSystemTime(new Date('2025-12-25T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('winter');
  });

  it('returns "winter" in early January', () => {
    vi.setSystemTime(new Date('2025-01-05T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('winter');
  });

  it('returns "valentines" on February 14', () => {
    vi.setSystemTime(new Date('2025-02-14T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('valentines');
  });

  it('returns "spring" in April', () => {
    vi.setSystemTime(new Date('2025-04-15T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('spring');
  });

  it('returns "summer" in July', () => {
    vi.setSystemTime(new Date('2025-07-04T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('summer');
  });

  it('returns "fall" in September', () => {
    vi.setSystemTime(new Date('2025-09-15T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('fall');
  });

  it('returns "fall" in November', () => {
    vi.setSystemTime(new Date('2025-11-15T12:00:00Z'));
    expect(detectSeasonalTheme()).toBe('fall');
  });
});
