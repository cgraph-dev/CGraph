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

// ─── Global Proxy mocks ─────────────────────────────────────────────
// These catch ANY named export automatically, preventing
// "No X export is defined on the mock" errors.

// Heroicons — returns stub React components for any icon name
vi.mock('@heroicons/react/24/outline', () => {
  return new Proxy(
    {},
    {
      get: (_t: unknown, name: string) => {
        if (name === '__esModule') return true;
        if (name === 'default') return {};
        const Icon = (props: Record<string, unknown>) => {
          const { createElement } = require('react');
          return createElement('svg', {
            'data-testid': `icon-${name}`,
            ...props,
          });
        };
        Icon.displayName = name;
        return Icon;
      },
    },
  );
});

vi.mock('@heroicons/react/24/solid', () => {
  return new Proxy(
    {},
    {
      get: (_t: unknown, name: string) => {
        if (name === '__esModule') return true;
        if (name === 'default') return {};
        const Icon = (props: Record<string, unknown>) => {
          const { createElement } = require('react');
          return createElement('svg', {
            'data-testid': `icon-${name}`,
            ...props,
          });
        };
        Icon.displayName = name;
        return Icon;
      },
    },
  );
});

vi.mock('@heroicons/react/20/solid', () => {
  return new Proxy(
    {},
    {
      get: (_t: unknown, name: string) => {
        if (name === '__esModule') return true;
        if (name === 'default') return {};
        const Icon = (props: Record<string, unknown>) => {
          const { createElement } = require('react');
          return createElement('svg', {
            'data-testid': `icon-${name}`,
            ...props,
          });
        };
        Icon.displayName = name;
        return Icon;
      },
    },
  );
});

// framer-motion — stub motion.* components, AnimatePresence, hooks
vi.mock('framer-motion', () => {
  const { createElement, forwardRef } = require('react');
  const motionHandler = {
    get: (_target: unknown, prop: string) => {
      if (typeof prop === 'string') {
        return forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const {
            children,
            initial: _i,
            animate: _a,
            exit: _e,
            transition: _t,
            variants: _v,
            whileHover: _wh,
            whileTap: _wt,
            whileInView: _wi,
            layout: _l,
            layoutId: _lid,
            onAnimationComplete: _oac,
            ...rest
          } = props;
          return createElement(prop, { ...rest, ref }, children);
        });
      }
      return undefined;
    },
  };
  return {
    motion: new Proxy({}, motionHandler),
    AnimatePresence: ({ children }: { children: unknown }) => children,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: () => {},
      onChange: () => () => {},
    }),
    useTransform: (val: unknown, _from: unknown, _to: unknown) => val,
    useSpring: (val: unknown) => val,
    useScroll: () => ({ scrollYProgress: { get: () => 0, onChange: () => () => {} } }),
    useAnimation: () => ({ start: async () => {}, stop: () => {}, set: () => {} }),
    useInView: () => true,
    useReducedMotion: () => false,
    LayoutGroup: ({ children }: { children: unknown }) => children,
    Reorder: new Proxy({}, motionHandler),
  };
});

// @/lib/animation-presets — stub all named exports
vi.mock('@/lib/animation-presets', () => {
  const emptyVariants = { initial: {}, animate: {}, exit: {} };
  const noop = () => ({});
  return {
    springs: { gentle: {}, bouncy: {}, stiff: {} },
    tweens: { fast: {}, normal: {}, slow: {} },
    loop: { repeat: Infinity, repeatType: 'loop' },
    loopWithDelay: (d: number) => ({ repeat: Infinity, delay: d }),
    staggerConfigs: { fast: 0.05, normal: 0.1, slow: 0.2 },
    entranceVariants: emptyVariants,
    chatBubbleAnimations: {},
    hoverAnimations: emptyVariants,
    createPulseAnimation: noop,
    createFireAnimation: noop,
    createElectricAnimation: noop,
    particleAnimations: emptyVariants,
    backgroundAnimations: emptyVariants,
    getStaggerDelay: () => 0,
    createRepeatTransition: noop,
    createSpring: noop,
    getRarityGlow: () => '',
    getTierGlow: () => '',
    default: { gentle: {}, bouncy: {}, stiff: {} },
  };
});

// @/lib/animations/animation-engine — stub haptics and animation helpers
vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
  },
  withHaptics: (fn: () => void) => fn,
  springPresets: { gentle: {}, bouncy: {}, stiff: {} },
}));

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
