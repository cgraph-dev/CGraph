/**
 * Performance Transaction Tracking Tests
 *
 * Tests for named transactions with nested spans,
 * duration measurement, and slow transaction reporting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ────────────────────────────────────────────────────
const { mockCaptureMessage, mockConfig } = vi.hoisted(() => ({
  mockCaptureMessage: vi.fn(),
  mockConfig: {
    enabled: true,
    debug: false,
  },
}));

vi.mock('../queue', () => ({
  captureMessage: mockCaptureMessage,
}));

vi.mock('../config', () => ({
  CONFIG: mockConfig,
}));

import { startTransaction, startSpan, endSpan, finishTransaction } from '../transactions';

describe('Performance Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.enabled = true;
    mockConfig.debug = false;
  });

  describe('startTransaction', () => {
    it('should return a transaction ID', () => {
      const txId = startTransaction('page-load');
      expect(txId).toMatch(/^tx_\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const a = startTransaction('tx-a');
      const b = startTransaction('tx-b');
      expect(a).not.toBe(b);
    });
  });

  describe('startSpan / endSpan', () => {
    it('should add spans to an active transaction', () => {
      const txId = startTransaction('api-call');
      startSpan(txId, 'fetch-data');
      // Should not throw
      endSpan(txId);
    });

    it('should be a no-op for invalid transaction ID', () => {
      // Should not throw
      startSpan('invalid-tx-id', 'orphan-span');
      endSpan('invalid-tx-id');
    });
  });

  describe('finishTransaction', () => {
    it('should complete without errors', () => {
      const txId = startTransaction('quick-op');
      finishTransaction(txId);
      // Transaction should be cleaned up
    });

    it('should be a no-op for invalid transaction ID', () => {
      finishTransaction('nonexistent');
      // Should not throw
    });

    it('should log debug info when debug is enabled', () => {
      mockConfig.debug = true;
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const txId = startTransaction('debug-tx');
      startSpan(txId, 'span-1');
      endSpan(txId);
      finishTransaction(txId);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking] Transaction finished:',
        expect.objectContaining({
          name: 'debug-tx',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should report slow transactions when report=true and duration > 3s', () => {
      // Mock performance.now() to simulate a slow transaction
      let time = 0;
      const spy = vi.spyOn(performance, 'now').mockImplementation(() => time);

      time = 1000;
      const txId = startTransaction('slow-query');
      time = 5000; // 4 seconds later
      finishTransaction(txId, true); // report = true

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Slow transaction: slow-query',
        'warning',
        expect.objectContaining({
          component: 'performance',
          tags: { type: 'slow_transaction' },
        })
      );

      spy.mockRestore();
    });

    it('should NOT report fast transactions even when report=true', () => {
      let time = 0;
      const spy = vi.spyOn(performance, 'now').mockImplementation(() => time);

      time = 1000;
      const txId = startTransaction('fast-op');
      time = 1500; // 500ms — fast
      finishTransaction(txId, true);

      expect(mockCaptureMessage).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should NOT report when report=false', () => {
      let time = 0;
      const spy = vi.spyOn(performance, 'now').mockImplementation(() => time);

      time = 0;
      const txId = startTransaction('slow-but-silent');
      time = 5000;
      finishTransaction(txId, false);

      expect(mockCaptureMessage).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should NOT report when config.enabled is false', () => {
      mockConfig.enabled = false;

      let time = 0;
      const spy = vi.spyOn(performance, 'now').mockImplementation(() => time);

      time = 0;
      const txId = startTransaction('disabled-tracking');
      time = 5000;
      finishTransaction(txId, true);

      expect(mockCaptureMessage).not.toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should track incomplete spans in debug output', () => {
      mockConfig.debug = true;
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const txId = startTransaction('incomplete-spans');
      startSpan(txId, 'never-ended');
      // Don't end the span
      finishTransaction(txId);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorTracking] Transaction finished:',
        expect.objectContaining({
          spans: expect.arrayContaining([
            expect.objectContaining({ name: 'never-ended', duration: 'incomplete' }),
          ]),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
