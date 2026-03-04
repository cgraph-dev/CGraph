/**
 * Navigation — Liquid Glass navigation bar tests.
 *
 * Verifies logo/brand, nav links, and CTA button rendering.
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
  };
});

import { Navigation } from '@/components/liquid-glass';

describe('Navigation', () => {
  it('renders logo/brand', () => {
    render(<Navigation />);
    expect(screen.getByText('CGraph')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(<Navigation />);
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Social Proof')).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(<Navigation />);
    // Desktop "Get Started" CTA
    const ctaLinks = screen.getAllByText(/Get Started/);
    expect(ctaLinks.length).toBeGreaterThan(0);
  });
});
