/* eslint-disable no-console -- Testing logger requires direct console access */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../logger';

describe('Logger', () => {
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    log: console.log,
    warn: console.warn,
    error: console.error,
    time: console.time,
    timeEnd: console.timeEnd,
  };

  beforeEach(() => {
    console.debug = vi.fn();
    console.info = vi.fn();
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.time = vi.fn();
    console.timeEnd = vi.fn();
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
  });

  it('should create a logger with namespace', () => {
    const logger = createLogger('TestLogger');
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should have time methods', () => {
    const logger = createLogger('TestLogger');
    expect(typeof logger.time).toBe('function');
    expect(typeof logger.timeEnd).toBe('function');
  });

  it('should have breadcrumb method', () => {
    const logger = createLogger('TestLogger');
    expect(typeof logger.breadcrumb).toBe('function');
  });

  // In test environment (non-dev), debug/info are typically suppressed
  // These tests verify the logger API works
  it('should not throw when calling debug', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.debug('test message')).not.toThrow();
  });

  it('should not throw when calling info', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('should not throw when calling warn', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.warn('test warning')).not.toThrow();
  });

  it('should not throw when calling error with string', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.error('test error')).not.toThrow();
  });

  it('should not throw when calling error with Error object', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.error(new Error('test error'))).not.toThrow();
  });

  it('should not throw when timing operations', () => {
    const logger = createLogger('TestLogger');
    expect(() => {
      logger.time('testOp');
      logger.timeEnd('testOp');
    }).not.toThrow();
  });

  it('should not throw when adding breadcrumb', () => {
    const logger = createLogger('TestLogger');
    expect(() => {
      logger.breadcrumb('User clicked button', { buttonId: 'submit' });
    }).not.toThrow();
  });

  it('should handle multiple arguments', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.debug('arg1', 'arg2', { key: 'value' })).not.toThrow();
    expect(() => logger.warn('warning:', 123, true)).not.toThrow();
  });

  it('should handle empty calls', () => {
    const logger = createLogger('TestLogger');
    expect(() => logger.debug()).not.toThrow();
    expect(() => logger.info()).not.toThrow();
  });
});
