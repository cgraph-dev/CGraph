import { describe, it, expect, vi, beforeEach } from 'vitest';

// These modules manage internal state, so we re-import fresh copies each test
let piiModule: typeof import('../pii');
let breadcrumbsModule: typeof import('../breadcrumbs');
let queueModule: typeof import('../queue');
let transactionsModule: typeof import('../transactions');

// Mock the api module to prevent real HTTP calls
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}));

// Force CONFIG to enable error tracking in tests
vi.mock('../config', () => ({
  CONFIG: {
    maxBreadcrumbs: 5,
    maxErrorsPerMinute: 10,
    retryInterval: 60000,
    maxRetries: 3,
    errorEndpoint: '/api/v1/telemetry/errors',
    enabled: true,
    debug: false,
    sentryDsn: undefined,
  },
}));

beforeEach(async () => {
  vi.resetModules();

  // Re-mock after resetModules
  vi.doMock('@/lib/api', () => ({
    api: { post: vi.fn().mockResolvedValue({}) },
  }));
  vi.doMock('../config', () => ({
    CONFIG: {
      maxBreadcrumbs: 5,
      maxErrorsPerMinute: 10,
      retryInterval: 60000,
      maxRetries: 3,
      errorEndpoint: '/api/v1/telemetry/errors',
      enabled: true,
      debug: false,
      sentryDsn: undefined,
    },
  }));

  piiModule = await import('../pii');
  breadcrumbsModule = await import('../breadcrumbs');
  queueModule = await import('../queue');
  transactionsModule = await import('../transactions');
});

// =============================================================================
// PII Stripping Tests
// =============================================================================

describe('PII Stripping', () => {
  it('should redact email addresses', () => {
    expect(piiModule.stripPiiFromString('Contact user@example.com for help')).toBe(
      'Contact [EMAIL] for help'
    );
  });

  it('should redact phone numbers', () => {
    expect(piiModule.stripPiiFromString('Call 555-123-4567')).toBe('Call [PHONE]');
  });

  it('should redact IP addresses', () => {
    expect(piiModule.stripPiiFromString('Server at 192.168.1.1')).toBe('Server at [IP]');
  });

  it('should redact JWT tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123def456';
    expect(piiModule.stripPiiFromString(`Bearer ${jwt}`)).toBe('Bearer [JWT]');
  });

  it('should redact sensitive keys in objects', () => {
    const obj = { username: 'alice', password: 'secret123', apiKey: 'abc' };
    const result = piiModule.stripPii(obj) as Record<string, unknown>;
    expect(result.username).toBe('alice');
    expect(result.password).toBe('[REDACTED]');
    expect(result.apiKey).toBe('[REDACTED]');
  });

  it('should handle nested objects', () => {
    const obj = { user: { email: 'x@y.com', auth: { token: 'secret' } } };
    const result = piiModule.stripPii(obj) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    expect(user.email).toBe('[EMAIL]');
    const auth = user.auth as Record<string, unknown>;
    expect(auth.token).toBe('[REDACTED]');
  });

  it('should handle arrays', () => {
    const arr = ['user@test.com', 'hello'];
    const result = piiModule.stripPii(arr) as string[];
    expect(result[0]).toBe('[EMAIL]');
    expect(result[1]).toBe('hello');
  });

  it('should return [MAX_DEPTH] for deeply nested objects', () => {
    let obj: Record<string, unknown> = { value: 'end' };
    for (let i = 0; i < 12; i++) {
      obj = { nested: obj };
    }
    const result = piiModule.stripPii(obj) as Record<string, unknown>;
    // Traverse 10 levels deep
    let current: unknown = result;
    for (let i = 0; i < 10; i++) {
      current = (current as Record<string, unknown>).nested;
    }
    // At depth 11 it should be '[MAX_DEPTH]'
    expect((current as Record<string, unknown>).nested).toBe('[MAX_DEPTH]');
  });

  it('should pass through null and undefined', () => {
    expect(piiModule.stripPii(null)).toBeNull();
    expect(piiModule.stripPii(undefined)).toBeUndefined();
  });

  it('should pass through numbers and booleans', () => {
    expect(piiModule.stripPii(42)).toBe(42);
    expect(piiModule.stripPii(true)).toBe(true);
  });
});

// =============================================================================
// Breadcrumb Tests
// =============================================================================

describe('Breadcrumbs', () => {
  it('should add and retrieve breadcrumbs', () => {
    breadcrumbsModule.addBreadcrumb({ category: 'ui', message: 'clicked button' });
    const crumbs = breadcrumbsModule.getBreadcrumbs();
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].category).toBe('ui');
    expect(crumbs[0].message).toBe('clicked button');
    expect(crumbs[0].timestamp).toBeTypeOf('number');
  });

  it('should enforce max breadcrumbs limit', () => {
    // CONFIG.maxBreadcrumbs is 5 in our mock
    for (let i = 0; i < 8; i++) {
      breadcrumbsModule.addBreadcrumb({ category: 'ui', message: `crumb ${i}` });
    }
    const crumbs = breadcrumbsModule.getBreadcrumbs();
    expect(crumbs).toHaveLength(5);
    // Oldest crumbs should have been evicted
    expect(crumbs[0].message).toBe('crumb 3');
    expect(crumbs[4].message).toBe('crumb 7');
  });

  it('should clear all breadcrumbs', () => {
    breadcrumbsModule.addBreadcrumb({ category: 'navigation', message: 'page load' });
    breadcrumbsModule.clearBreadcrumbs();
    expect(breadcrumbsModule.getBreadcrumbs()).toHaveLength(0);
  });

  it('should return a snapshot (not reference) of breadcrumbs', () => {
    breadcrumbsModule.addBreadcrumb({ category: 'http', message: 'request' });
    const snapshot1 = breadcrumbsModule.getBreadcrumbs();
    breadcrumbsModule.addBreadcrumb({ category: 'http', message: 'response' });
    const snapshot2 = breadcrumbsModule.getBreadcrumbs();
    expect(snapshot1).toHaveLength(1);
    expect(snapshot2).toHaveLength(2);
  });
});

// =============================================================================
// Queue / Capture Tests
// =============================================================================

describe('Error Queue & Capture', () => {
  it('should capture an Error object and return an error id', () => {
    const id = queueModule.captureError(new Error('Test failure'));
    expect(id).toBeTypeOf('string');
    expect(id).toMatch(/^err_/);
  });

  it('should capture a string error', () => {
    const id = queueModule.captureError('something went wrong');
    expect(id).toBeTypeOf('string');
  });

  it('should capture a message with level', () => {
    const id = queueModule.captureMessage('info event', 'info', { component: 'test' });
    expect(id).toBeTypeOf('string');
  });

  it('should capture a fatal error', () => {
    const id = queueModule.captureFatal(new Error('crash'), { component: 'app' });
    expect(id).toBeTypeOf('string');
  });

  it('should set and clear user context', () => {
    // setUser and clearUser shouldn't throw
    expect(() => queueModule.setUser({ id: '123', username: 'alice' })).not.toThrow();
    expect(() => queueModule.clearUser()).not.toThrow();
  });
});

// =============================================================================
// Transaction Tests
// =============================================================================

describe('Performance Transactions', () => {
  it('should start a transaction and return an id', () => {
    const txId = transactionsModule.startTransaction('page-load');
    expect(txId).toBeTypeOf('string');
    expect(txId).toMatch(/^tx_/);
  });

  it('should add spans and finish a transaction without errors', () => {
    const txId = transactionsModule.startTransaction('api-call');
    transactionsModule.startSpan(txId, 'fetch');
    transactionsModule.endSpan(txId);
    expect(() => transactionsModule.finishTransaction(txId)).not.toThrow();
  });

  it('should no-op for invalid transaction ids', () => {
    expect(() => transactionsModule.startSpan('invalid', 'span')).not.toThrow();
    expect(() => transactionsModule.endSpan('invalid')).not.toThrow();
    expect(() => transactionsModule.finishTransaction('invalid')).not.toThrow();
  });
});
