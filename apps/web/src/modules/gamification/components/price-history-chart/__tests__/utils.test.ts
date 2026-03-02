import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '../utils';

describe('calculateMetrics', () => {
  it('returns null for empty data', () => {
    expect(calculateMetrics([])).toBeNull();
  });

  it('calculates min and max prices', () => {
    const data = [
      { price: 10, timestamp: new Date('2025-01-01') },
      { price: 50, timestamp: new Date('2025-01-02') },
      { price: 30, timestamp: new Date('2025-01-03') },
    ];
    const metrics = calculateMetrics(data);
    expect(metrics).not.toBeNull();
    expect(metrics!.min).toBe(10);
    expect(metrics!.max).toBe(50);
  });

  it('calculates positive change', () => {
    const data = [
      { price: 100, timestamp: new Date('2025-01-01') },
      { price: 150, timestamp: new Date('2025-01-02') },
    ];
    const metrics = calculateMetrics(data);
    expect(metrics!.isPositive).toBe(true);
    expect(metrics!.change).toBe(50);
  });

  it('calculates negative change', () => {
    const data = [
      { price: 100, timestamp: new Date('2025-01-01') },
      { price: 80, timestamp: new Date('2025-01-02') },
    ];
    const metrics = calculateMetrics(data);
    expect(metrics!.isPositive).toBe(false);
    expect(metrics!.change).toBe(-20);
  });

  it('handles single data point', () => {
    const data = [{ price: 42, timestamp: new Date('2025-01-01') }];
    const metrics = calculateMetrics(data);
    expect(metrics).not.toBeNull();
    expect(metrics!.min).toBe(42);
    expect(metrics!.max).toBe(42);
    expect(metrics!.change).toBe(0);
  });

  it('sets range to 1 when min equals max', () => {
    const data = [
      { price: 50, timestamp: new Date('2025-01-01') },
      { price: 50, timestamp: new Date('2025-01-02') },
    ];
    const metrics = calculateMetrics(data);
    expect(metrics!.range).toBe(1);
  });

  it('tracks latest and first values', () => {
    const data = [
      { price: 10, timestamp: new Date('2025-01-01') },
      { price: 20, timestamp: new Date('2025-01-02') },
      { price: 30, timestamp: new Date('2025-01-03') },
    ];
    const metrics = calculateMetrics(data);
    expect(metrics!.first).toBe(10);
    expect(metrics!.latest).toBe(30);
  });
});
