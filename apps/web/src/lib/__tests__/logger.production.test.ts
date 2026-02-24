/**
 * Production-Safe Logger Tests
 *
 * CVE-CGRAPH-2026-008: Verify that the production logger
 * correctly suppresses debug output in prod environments,
 * integrates with error tracking, and formats structured logs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock captureError ────────────────────────────────────────────────────
const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn(),
}));

vi.mock('@/lib/error-tracking', () => ({
  captureError: mockCaptureError,
}));

// Import default + named exports
import logger, { authLogger, e2eeLogger, apiLogger, wsLogger } from '../logger.production';

describe('ProductionLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configure for development-like behavior (all levels enabled)
    logger.configure({
      enabled: true,
      minLevel: 'debug',
      includeTimestamp: false,
      includeStack: false,
    });
  });

  // ── Level filtering ──────────────────────────────────────────────────

  describe('shouldLog / level filtering', () => {
    it('should log debug in dev mode', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('test debug');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log info messages', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('test info');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log warn messages', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('test warn');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log error messages', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('test error');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should suppress debug when minLevel is info', () => {
      logger.configure({ minLevel: 'info' });
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('suppressed');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should suppress debug and info when minLevel is warn', () => {
      logger.configure({ minLevel: 'warn' });
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.debug('suppressed');
      logger.info('suppressed');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
    });

    it('should suppress ALL output when disabled', () => {
      logger.configure({ enabled: false });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.error('suppressed even error');
      expect(errorSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    it('should only allow error level in production config', () => {
      logger.configure({ minLevel: 'error' });
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logger.debug('no');
      logger.info('no');
      logger.warn('no');
      logger.error('yes');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  // ── Formatting ───────────────────────────────────────────────────────

  describe('format', () => {
    it('should include level in output', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('hello');
      expect(spy.mock.calls[0]![0]).toContain('[INFO]');
      spy.mockRestore();
    });

    it('should include context as JSON', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('event', { userId: '42' });
      const output = spy.mock.calls[0]![0];
      expect(output).toContain('"userId"');
      expect(output).toContain('"42"');
      spy.mockRestore();
    });

    it('should include timestamp when configured', () => {
      logger.configure({ includeTimestamp: true });
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('timestamped');
      const output = spy.mock.calls[0]![0];
      // ISO timestamp format
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T/);
      spy.mockRestore();
    });
  });

  // ── Error tracking integration ───────────────────────────────────────

  describe('error tracking integration', () => {
    it('should call captureError for Error objects', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('tracked error');
      logger.error('Something failed', err);

      expect(mockCaptureError).toHaveBeenCalledWith(err, {
        component: 'logger',
        action: 'production_error',
        metadata: undefined,
      });
      spy.mockRestore();
    });

    it('should wrap non-Error objects in Error for tracking', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Non-error failure', 'string-error');

      expect(mockCaptureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'logger',
          action: 'production_error',
          metadata: expect.objectContaining({ originalError: 'string-error' }),
        })
      );
      spy.mockRestore();
    });

    it('should NOT call captureError when error param is undefined', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Message only');
      expect(mockCaptureError).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should pass context metadata to captureError', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('fail', new Error('oops'), { route: '/checkout' });

      expect(mockCaptureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          metadata: { route: '/checkout' },
        })
      );
      spy.mockRestore();
    });
  });

  // ── Performance helpers ──────────────────────────────────────────────

  describe('performance helpers', () => {
    it('should call console.time/timeEnd when enabled', () => {
      const timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {});
      const timeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});

      logger.time('perf-test');
      logger.timeEnd('perf-test');

      expect(timeSpy).toHaveBeenCalledWith('perf-test');
      expect(timeEndSpy).toHaveBeenCalledWith('perf-test');

      timeSpy.mockRestore();
      timeEndSpy.mockRestore();
    });

    it('should not call console.time when disabled', () => {
      logger.configure({ enabled: false });
      const timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {});

      logger.time('suppressed-timer');
      expect(timeSpy).not.toHaveBeenCalled();

      timeSpy.mockRestore();
    });
  });

  // ── configure / getConfig ────────────────────────────────────────────

  describe('configure / getConfig', () => {
    it('should return current config', () => {
      const config = logger.getConfig();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('minLevel');
      expect(config).toHaveProperty('includeTimestamp');
      expect(config).toHaveProperty('includeStack');
    });

    it('should return a copy (not reference)', () => {
      const config = logger.getConfig();
      config.enabled = false;
      expect(logger.getConfig().enabled).toBe(true); // Original unchanged
    });

    it('should merge partial config', () => {
      logger.configure({ includeStack: true });
      expect(logger.getConfig().includeStack).toBe(true);
      expect(logger.getConfig().enabled).toBe(true); // Unchanged
    });
  });

  // ── Specialized loggers ──────────────────────────────────────────────

  describe('specialized loggers', () => {
    it('authLogger should prefix with [Auth]', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      authLogger.log('login success');
      expect(spy.mock.calls[0]![0]).toContain('[Auth]');
      spy.mockRestore();
    });

    it('e2eeLogger should prefix with [E2EE]', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      e2eeLogger.log('keys rotated');
      expect(spy.mock.calls[0]![0]).toContain('[E2EE]');
      spy.mockRestore();
    });

    it('apiLogger should prefix with [API]', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      apiLogger.log('request sent');
      expect(spy.mock.calls[0]![0]).toContain('[API]');
      spy.mockRestore();
    });

    it('wsLogger should prefix with [WebSocket]', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      wsLogger.log('connected');
      expect(spy.mock.calls[0]![0]).toContain('[WebSocket]');
      spy.mockRestore();
    });

    it('authLogger.error should call captureError', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('auth failure');
      authLogger.error('login failed', err);
      expect(mockCaptureError).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
