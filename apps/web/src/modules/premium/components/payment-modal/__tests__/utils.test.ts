import { describe, it, expect } from 'vitest';
import {
  formatCardNumber,
  formatExpiry,
  formatCvc,
  generateTransactionId,
  calculateFinalPrice,
  calculateSavings,
} from '../utils';

describe('formatCardNumber', () => {
  it('groups digits in sets of 4', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('strips non-digit characters', () => {
    expect(formatCardNumber('4111-1111-1111')).toBe('4111 1111 1111');
  });

  it('handles partial input', () => {
    expect(formatCardNumber('41')).toBe('41');
    expect(formatCardNumber('411111')).toBe('4111 11');
  });

  it('limits to 19 characters (16 digits + 3 spaces)', () => {
    const result = formatCardNumber('41111111111111119999');
    expect(result.length).toBeLessThanOrEqual(19);
  });
});

describe('formatExpiry', () => {
  it('adds slash after 2 digits', () => {
    expect(formatExpiry('1225')).toBe('12/25');
  });

  it('handles partial input', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12/');
  });

  it('strips non-digit characters', () => {
    expect(formatExpiry('12/25')).toBe('12/25');
  });
});

describe('formatCvc', () => {
  it('strips non-digits', () => {
    expect(formatCvc('12a3')).toBe('123');
  });

  it('limits to 4 characters', () => {
    expect(formatCvc('12345')).toBe('1234');
  });
});

describe('generateTransactionId', () => {
  it('starts with TXN_', () => {
    expect(generateTransactionId()).toMatch(/^TXN_/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTransactionId()));
    expect(ids.size).toBe(100);
  });
});

describe('calculateFinalPrice', () => {
  it('returns original price when no promo', () => {
    expect(calculateFinalPrice(100, 0.2, false)).toBe(100);
  });

  it('applies percentage discount when promo applied', () => {
    expect(calculateFinalPrice(100, 0.2, true)).toBe(80);
  });

  it('handles 100% discount', () => {
    expect(calculateFinalPrice(50, 1, true)).toBe(0);
  });
});

describe('calculateSavings', () => {
  it('calculates savings from original price + promo', () => {
    const savings = calculateSavings(80, 100, 0.1);
    // originalPrice - price + promoDiscount * price = 100 - 80 + 0.1 * 80 = 28
    expect(savings).toBe(28);
  });

  it('calculates savings from promo only when no original price', () => {
    const savings = calculateSavings(100, undefined, 0.2);
    expect(savings).toBe(20);
  });

  it('returns 0 savings when no discount and no original price', () => {
    expect(calculateSavings(100, undefined, 0)).toBe(0);
  });
});
