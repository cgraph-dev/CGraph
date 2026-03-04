/**
 * LiquidGlassLayout — Shared page shell tests.
 *
 * Verifies children rendering, title prop, and Navigation/Footer inclusion.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Framer Motion mock ──────────────────────────────────────────────────────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === 'string') {
            return ({ children, ...props }: Record<string, unknown>) => {
              const {
                initial: _initial,
                animate: _animate,
                exit: _exit,
                whileHover: _whileHover,
                whileInView: _whileInView,
                whileTap: _whileTap,
                transition: _transition,
                variants: _variants,
                viewport: _viewport,
                layout: _layout,
                ...rest
              } = props;
              const Tag = prop as keyof JSX.IntrinsicElements;
              return <Tag {...rest}>{children}</Tag>;
            };
          }
          return undefined;
        },
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useScroll: () => ({ scrollYProgress: { onChange: vi.fn(), get: () => 0 } }),
    useTransform: () => 0,
    useMotionValue: () => ({ get: vi.fn(() => 0), set: vi.fn() }),
    useSpring: () => ({ get: vi.fn(() => 0), set: vi.fn() }),
  };
});

// ── React-router-dom mock ───────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

import { LiquidGlassLayout } from '@/components/liquid-glass';

describe('LiquidGlassLayout', () => {
  it('renders children content', () => {
    render(
      <LiquidGlassLayout>
        <p>Test child content</p>
      </LiquidGlassLayout>
    );
    expect(screen.getByText('Test child content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <LiquidGlassLayout title="Terms of Service">
        <p>Terms content</p>
      </LiquidGlassLayout>
    );
    expect(screen.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeInTheDocument();
  });

  it('renders Navigation and Footer', () => {
    render(
      <LiquidGlassLayout>
        <p>Page body</p>
      </LiquidGlassLayout>
    );
    // Navigation renders the brand name, Footer renders copyright
    const cgraphTexts = screen.getAllByText('CGraph');
    // At least 2: one in Navigation logo, one in Footer brand
    expect(cgraphTexts.length).toBeGreaterThanOrEqual(2);
    // Footer copyright
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${year} CGraph`))).toBeInTheDocument();
  });
});
