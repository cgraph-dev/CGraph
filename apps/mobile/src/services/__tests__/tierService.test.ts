/**
 * Tests for tierService — subscription tier API functions.
 *
 * @module services/__tests__/tierService.test
 */

import {
  listTiers,
  getTier,
  getMyTier,
  compareTiers,
  checkAction,
  checkFeature,
  canCreateForum,
  canJoinForum,
  canCreateThread,
  hasAIModeration,
  hasCustomCSS,
  hasAPIAccess,
} from '../tierService';

// Mock the api module
jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { api } from '../api';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── listTiers ────────────────────────────────────────────────────────

describe('listTiers', () => {
  it('returns array of tier basics', async () => {
    const tiers = [
      { name: 'free', display_name: 'Free' },
      { name: 'premium', display_name: 'Premium' },
      { name: 'enterprise', display_name: 'Enterprise' },
    ];
    mockApi.get.mockResolvedValue({ data: { data: tiers } });
    const result = await listTiers();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers');
    expect(result).toEqual(tiers);
  });
});

// ── getTier ──────────────────────────────────────────────────────────

describe('getTier', () => {
  it('returns full tier details for a given tier name', async () => {
    const tier = { name: 'premium', limits: { forums: 10 } };
    mockApi.get.mockResolvedValue({ data: { data: tier } });
    const result = await getTier('premium');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/premium');
    expect(result).toEqual(tier);
  });
});

// ── getMyTier ────────────────────────────────────────────────────────

describe('getMyTier', () => {
  it('returns current user tier info', async () => {
    const myTier = { tier: 'free', effective_limits: { forums: 3 } };
    mockApi.get.mockResolvedValue({ data: { data: myTier } });
    const result = await getMyTier();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/me');
    expect(result).toEqual(myTier);
  });
});

// ── compareTiers ─────────────────────────────────────────────────────

describe('compareTiers', () => {
  it('returns comparison data for two tiers', async () => {
    const comparison = { from: 'free', to: 'premium', differences: [] };
    mockApi.get.mockResolvedValue({ data: { data: comparison } });
    const result = await compareTiers('free', 'premium');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/compare', {
      params: { from: 'free', to: 'premium' },
    });
    expect(result).toEqual(comparison);
  });
});

// ── checkAction ──────────────────────────────────────────────────────

describe('checkAction', () => {
  it('returns action check result for create_forum', async () => {
    const actionResult = { allowed: true, limit: 10, current: 3 };
    mockApi.get.mockResolvedValue({ data: { data: actionResult } });
    const result = await checkAction('create_forum');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/check/create_forum');
    expect(result).toEqual(actionResult);
  });

  it('returns disallowed action', async () => {
    const actionResult = { allowed: false, limit: 1, current: 1 };
    mockApi.get.mockResolvedValue({ data: { data: actionResult } });
    const result = await checkAction('join_forum');
    expect(result.allowed).toBe(false);
  });
});

// ── checkFeature ─────────────────────────────────────────────────────

describe('checkFeature', () => {
  it('returns true when feature is enabled', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { enabled: true } } });
    const result = await checkFeature('api.access');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/features/api.access');
    expect(result).toBe(true);
  });

  it('returns false when feature is disabled', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { enabled: false } } });
    const result = await checkFeature('forums.custom_css');
    expect(result).toBe(false);
  });
});

// ── Convenience wrappers ─────────────────────────────────────────────

describe('canCreateForum', () => {
  it('returns true when allowed', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { allowed: true } } });
    expect(await canCreateForum()).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/check/create_forum');
  });

  it('returns false when not allowed', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { allowed: false } } });
    expect(await canCreateForum()).toBe(false);
  });
});

describe('canJoinForum', () => {
  it('checks join_forum action', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { allowed: true } } });
    expect(await canJoinForum()).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/check/join_forum');
  });
});

describe('canCreateThread', () => {
  it('checks create_thread action', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { allowed: false } } });
    expect(await canCreateThread()).toBe(false);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/check/create_thread');
  });
});

describe('hasAIModeration', () => {
  it('checks ai.moderation feature', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { enabled: true } } });
    expect(await hasAIModeration()).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/features/ai.moderation');
  });
});

describe('hasCustomCSS', () => {
  it('checks forums.custom_css feature', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { enabled: false } } });
    expect(await hasCustomCSS()).toBe(false);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/features/forums.custom_css');
  });
});

describe('hasAPIAccess', () => {
  it('checks api.access feature', async () => {
    mockApi.get.mockResolvedValue({ data: { data: { enabled: true } } });
    expect(await hasAPIAccess()).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/tiers/features/api.access');
  });
});
