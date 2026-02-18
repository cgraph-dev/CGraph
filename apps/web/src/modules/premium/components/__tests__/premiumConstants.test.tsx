// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { TIER_ICONS, TIER_COLORS, TIER_GRADIENTS } from '../subscriptionCard.constants';
import {
  TIER_ICONS as FC_TIER_ICONS,
  TIER_COLORS as FC_TIER_COLORS,
  TIER_GRADIENTS as FC_TIER_GRADIENTS,
  DEFAULT_CATEGORIES,
} from '../featureComparisonConstants';
import { DEFAULT_PACKAGES } from '../coinShopData';

// ── Types reference ────────────────────────────────────────────────────

const ALL_TIERS = ['free', 'premium', 'enterprise'] as const;

// ── Tests ──────────────────────────────────────────────────────────────

describe('subscriptionCard.constants', () => {
  describe('TIER_ICONS', () => {
    it('has an entry for every tier', () => {
      for (const tier of ALL_TIERS) {
        expect(TIER_ICONS[tier]).toBeDefined();
      }
    });

    it('returns React nodes', () => {
      for (const tier of ALL_TIERS) {
        expect(TIER_ICONS[tier]).not.toBeNull();
      }
    });
  });

  describe('TIER_COLORS', () => {
    it('has an entry for every tier', () => {
      for (const tier of ALL_TIERS) {
        expect(typeof TIER_COLORS[tier]).toBe('string');
        expect(TIER_COLORS[tier].length).toBeGreaterThan(0);
      }
    });

    it('maps tiers to expected colors', () => {
      expect(TIER_COLORS.free).toBe('gray');
      expect(TIER_COLORS.premium).toBe('purple');
      expect(TIER_COLORS.enterprise).toBe('rose');
    });
  });

  describe('TIER_GRADIENTS', () => {
    it('has an entry for every tier', () => {
      for (const tier of ALL_TIERS) {
        expect(TIER_GRADIENTS[tier]).toContain('from-');
        expect(TIER_GRADIENTS[tier]).toContain('to-');
      }
    });
  });
});

describe('featureComparisonConstants', () => {
  describe('TIER_ICONS', () => {
    it('has an entry for every tier', () => {
      for (const tier of ALL_TIERS) {
        expect(FC_TIER_ICONS[tier]).toBeDefined();
      }
    });
  });

  describe('TIER_COLORS', () => {
    it('matches same color mapping as subscriptionCard', () => {
      for (const tier of ALL_TIERS) {
        expect(FC_TIER_COLORS[tier]).toBe(TIER_COLORS[tier]);
      }
    });
  });

  describe('TIER_GRADIENTS', () => {
    it('has gradient strings for every tier', () => {
      for (const tier of ALL_TIERS) {
        expect(FC_TIER_GRADIENTS[tier]).toContain('from-');
      }
    });
  });

  describe('DEFAULT_CATEGORIES', () => {
    it('has at least 3 categories', () => {
      expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(3);
    });

    it('each category has a name and features array', () => {
      for (const category of DEFAULT_CATEGORIES) {
        expect(typeof category.name).toBe('string');
        expect(category.name.length).toBeGreaterThan(0);
        expect(Array.isArray(category.features)).toBe(true);
        expect(category.features.length).toBeGreaterThan(0);
      }
    });

    it('each feature has values for all tiers', () => {
      for (const category of DEFAULT_CATEGORIES) {
        for (const feature of category.features) {
          expect(typeof feature.name).toBe('string');
          expect(typeof feature.description).toBe('string');
          expect(feature.values).toBeDefined();
          for (const tier of ALL_TIERS) {
            expect(feature.values[tier]).toBeDefined();
          }
        }
      }
    });

    it('includes Core Features category', () => {
      const core = DEFAULT_CATEGORIES.find((c) => c.name === 'Core Features');
      expect(core).toBeDefined();
      expect(core!.features.some((f) => f.name === 'Groups')).toBe(true);
    });

    it('includes Communication category', () => {
      const comm = DEFAULT_CATEGORIES.find((c) => c.name === 'Communication');
      expect(comm).toBeDefined();
    });

    it('ultimate tier has best values', () => {
      const core = DEFAULT_CATEGORIES.find((c) => c.name === 'Core Features')!;
      const groups = core.features.find((f) => f.name === 'Groups')!;
      expect(groups.values.enterprise).toBe('Unlimited');
    });

    it('Personal Manager is only available on ultimate', () => {
      const support = DEFAULT_CATEGORIES.find((c) => c.name === 'Support & Extras')!;
      const manager = support.features.find((f) => f.name === 'Personal Manager')!;
      expect(manager.values.free).toBe(false);
      expect(manager.values.premium).toBe(false);
      expect(manager.values.enterprise).toBe(true);
    });
  });
});

describe('coinShopData — DEFAULT_PACKAGES', () => {
  it('has 6 packages', () => {
    expect(DEFAULT_PACKAGES).toHaveLength(6);
  });

  it('each package has required fields', () => {
    for (const pkg of DEFAULT_PACKAGES) {
      expect(typeof pkg.id).toBe('string');
      expect(typeof pkg.name).toBe('string');
      expect(typeof pkg.coins).toBe('number');
      expect(typeof pkg.bonusCoins).toBe('number');
      expect(typeof pkg.price).toBe('number');
      expect(typeof pkg.currency).toBe('string');
      expect(typeof pkg.isPopular).toBe('boolean');
    }
  });

  it('packages are sorted by price ascending', () => {
    for (let i = 1; i < DEFAULT_PACKAGES.length; i++) {
      expect(DEFAULT_PACKAGES[i].price).toBeGreaterThan(DEFAULT_PACKAGES[i - 1].price);
    }
  });

  it('exactly one package is marked popular', () => {
    const popular = DEFAULT_PACKAGES.filter((p) => p.isPopular);
    expect(popular).toHaveLength(1);
    expect(popular[0].id).toBe('popular');
  });

  it('all packages use USD currency', () => {
    for (const pkg of DEFAULT_PACKAGES) {
      expect(pkg.currency).toBe('USD');
    }
  });

  it('coins increase with price', () => {
    for (let i = 1; i < DEFAULT_PACKAGES.length; i++) {
      expect(DEFAULT_PACKAGES[i].coins).toBeGreaterThan(DEFAULT_PACKAGES[i - 1].coins);
    }
  });

  it('each package has unique id', () => {
    const ids = DEFAULT_PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starter has no bonus coins', () => {
    const starter = DEFAULT_PACKAGES.find((p) => p.id === 'starter')!;
    expect(starter.bonusCoins).toBe(0);
  });
});
