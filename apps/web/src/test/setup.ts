/**
 * Vitest Test Setup
 *
 * Global test configuration and mocks.
 * @since v0.7.27
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

// Mock logger to prevent circular dependency issues in test environment
// (logger → error-tracking → react.tsx can fail during module evaluation)
vi.mock('@/lib/logger', () => {
  const noop = () => {};
  const createLogger = (_namespace: string) => ({
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: noop,
    time: noop,
    timeEnd: noop,
    breadcrumb: noop,
  });
  return {
    createLogger,
    logger: createLogger('CGraph'),
    socketLogger: createLogger('Socket'),
    e2eeLogger: createLogger('E2EE'),
    authLogger: createLogger('Auth'),
    apiLogger: createLogger('API'),
    forumLogger: createLogger('Forum'),
    chatLogger: createLogger('Chat'),
    themeLogger: createLogger('Theme'),
    gamificationLogger: createLogger('Gamification'),
    routeLogger: createLogger('Route'),
  };
});

// MSW server for API mocking
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

export { server };

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Silence console errors/warnings in tests unless specifically testing them
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn((...args: unknown[]) => {
    // Only show actual errors, not React warnings
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.apply(console, args);
  });

  console.warn = vi.fn((...args: unknown[]) => {
    originalWarn.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
