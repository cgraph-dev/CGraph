import { describe, it, expect } from 'vitest';
import { getRankChange, formatScore, getScoreLabel } from '../utils';

describe('getRankChange', () => {
  it('returns "up" when rank improved', () => {
    expect(getRankChange({ rank: 3, previousRank: 5 } as never)).toBe('up');
  });

  it('returns "down" when rank worsened', () => {
    expect(getRankChange({ rank: 8, previousRank: 3 } as never)).toBe('down');
  });

  it('returns "none" when rank unchanged', () => {
    expect(getRankChange({ rank: 5, previousRank: 5 } as never)).toBe('none');
  });

  it('returns "none" when no previous rank', () => {
    expect(getRankChange({ rank: 1 } as never)).toBe('none');
  });
});

describe('formatScore', () => {
  it('returns raw number under 1000', () => {
    expect(formatScore(42)).toBe('42');
    expect(formatScore(999)).toBe('999');
  });

  it('formats thousands with K', () => {
    expect(formatScore(1000)).toBe('1.0K');
    expect(formatScore(2500)).toBe('2.5K');
  });

  it('formats millions with M', () => {
    expect(formatScore(1000000)).toBe('1.0M');
    expect(formatScore(5500000)).toBe('5.5M');
  });
});

describe('getScoreLabel', () => {
  it('returns "XP" for xp type', () => {
    expect(getScoreLabel('xp')).toBe('XP');
  });

  it('returns "karma" for karma type', () => {
    expect(getScoreLabel('karma')).toBe('karma');
  });

  it('returns "msgs" for messages type', () => {
    expect(getScoreLabel('messages')).toBe('msgs');
  });

  it('returns "posts" for posts type', () => {
    expect(getScoreLabel('posts')).toBe('posts');
  });

  it('returns "unlocked" for achievements type', () => {
    expect(getScoreLabel('achievements')).toBe('unlocked');
  });

  it('returns "referrals" for referrals type', () => {
    expect(getScoreLabel('referrals')).toBe('referrals');
  });

  it('returns empty string for unknown type', () => {
    expect(getScoreLabel('unknown' as never)).toBe('');
  });
});
