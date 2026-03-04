/**
 * App Entry Point Tests
 *
 * Basic smoke tests for the main app entry point and routing.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock heavy animation dependencies
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => ({ to: vi.fn(), fromTo: vi.fn() })),
  },
  ScrollTrigger: {},
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
          // Filter out framer-motion specific props
          const htmlProps: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(props)) {
            if (
              ![
                'initial',
                'animate',
                'exit',
                'variants',
                'whileHover',
                'whileTap',
                'whileInView',
                'viewport',
                'custom',
                'transition',
                'layout',
                'layoutId',
              ].includes(key)
            ) {
              htmlProps[key] = val;
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = prop as any;
          return <Tag {...htmlProps}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
  useInView: () => true,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}));

// Mock react-dom/client so importing main.tsx doesn't call createRoot on a missing #root element
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
  },
  createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
}));

describe('App smoke tests', () => {
  it('main entry file exists and exports correctly', async () => {
    // Verify the main module can be loaded (static analysis)
    const mainModule = await import('../main');
    expect(mainModule).toBeDefined();
  });

  it('LandingPage module can be imported', async () => {
    const mod = await import('../pages/LandingPage');
    expect(mod.default).toBeDefined();
  });

  it('Logo component can be imported', async () => {
    const mod = await import('../components/Logo');
    expect(mod.LogoIcon).toBeDefined();
  });
});
