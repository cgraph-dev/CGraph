/**
 * PricingSection — Liquid Glass pricing cards tests.
 *
 * Verifies pricing heading, plan names, and prices.
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

import { PricingSection } from '@/components/liquid-glass';

describe('PricingSection', () => {
  it('renders pricing heading', () => {
    render(<PricingSection />);
    expect(screen.getByText('Simple, transparent pricing')).toBeInTheDocument();
  });

  it('renders plan names', () => {
    render(<PricingSection />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders prices', () => {
    render(<PricingSection />);
    // Monthly prices shown by default
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$14.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });
});
