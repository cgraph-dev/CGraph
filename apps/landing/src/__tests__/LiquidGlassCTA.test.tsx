/**
 * CTASection — Liquid Glass final CTA tests.
 *
 * Verifies CTA heading and action buttons with links.
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

import { CTASection } from '@/components/liquid-glass';

describe('CTASection', () => {
  it('renders CTA heading', () => {
    render(<CTASection />);
    expect(screen.getByText('Ready for truly private communication?')).toBeInTheDocument();
  });

  it('renders action buttons with links', () => {
    render(<CTASection />);
    const startFree = screen.getByText('Start Free');
    expect(startFree).toBeInTheDocument();
    expect(startFree.closest('a')).toHaveAttribute('href', expect.stringContaining('/register'));

    const viewPlans = screen.getByText('View Plans');
    expect(viewPlans).toBeInTheDocument();
    expect(viewPlans.closest('a')).toHaveAttribute('href', '#pricing');
  });
});
