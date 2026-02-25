import { describe, it, expect } from 'vitest';
import { getRewardIcon, getEventEmoji, normalizeTiers } from '../utils';

describe('getRewardIcon', () => {
  it('returns coin icon for coins reward', () => {
    expect(getRewardIcon({ type: 'coins', id: '1', name: 'Coins' } as never)).toBe('🪙');
  });

  it('returns gem icon for gems reward', () => {
    expect(getRewardIcon({ type: 'gems', id: '1', name: 'Gems' } as never)).toBe('💎');
  });

  it('returns star icon for xp reward', () => {
    expect(getRewardIcon({ type: 'xp', id: '1', name: 'XP' } as never)).toBe('⭐');
  });

  it('returns fallback icon for unknown type', () => {
    expect(getRewardIcon({ type: 'unknown', id: '1', name: 'X' } as never)).toBe('🎁');
  });
});

describe('getEventEmoji', () => {
  it('returns seasonal emoji', () => {
    expect(getEventEmoji('seasonal')).toBe('🎄');
  });

  it('returns halloween emoji', () => {
    expect(getEventEmoji('halloween')).toBe('🎃');
  });

  it('is case-insensitive', () => {
    expect(getEventEmoji('HALLOWEEN')).toBe('🎃');
    expect(getEventEmoji('Winter')).toBe('❄️');
  });

  it('returns fallback for unknown type', () => {
    expect(getEventEmoji('unknown')).toBe('🎮');
  });
});

describe('normalizeTiers', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeTiers([])).toEqual([]);
  });

  it('assigns sequential IDs starting from 1', () => {
    const tiers = [
      { level: 1, xpRequired: 0, freeRewards: [], premiumRewards: [] },
      { level: 2, xpRequired: 100, freeRewards: [], premiumRewards: [] },
    ];
    const normalized = normalizeTiers(tiers as never[]);
    expect(normalized[0].id).toBe(1);
    expect(normalized[1].id).toBe(2);
  });

  it('provides default rewards when none exist', () => {
    const tiers = [{ level: 1, xpRequired: 0, freeRewards: [], premiumRewards: [] }];
    const normalized = normalizeTiers(tiers as never[]);
    expect(normalized[0].freeReward).toBeDefined();
    expect(normalized[0].freeReward.icon).toBe('🎁');
    expect(normalized[0].premiumReward).toBeDefined();
    expect(normalized[0].premiumReward.icon).toBe('⭐');
  });

  it('uses reward type icon when rewards exist', () => {
    const tiers = [
      {
        level: 1,
        xpRequired: 0,
        freeRewards: [{ id: '1', name: 'Coins', type: 'coins' }],
        premiumRewards: [{ id: '2', name: 'Gems', type: 'gems' }],
      },
    ];
    const normalized = normalizeTiers(tiers as never[]);
    expect(normalized[0].freeReward.icon).toBe('🪙');
    expect(normalized[0].premiumReward.icon).toBe('💎');
  });
});
