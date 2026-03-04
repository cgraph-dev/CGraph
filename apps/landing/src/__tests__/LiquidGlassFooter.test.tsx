/**
 * Footer — Liquid Glass footer tests.
 *
 * Verifies copyright text, link sections, and social/brand links.
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

import { Footer } from '@/components/liquid-glass';

describe('Footer', () => {
  it('renders copyright text', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${year} CGraph`))).toBeInTheDocument();
  });

  it('renders link sections', () => {
    render(<Footer />);
    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('resources')).toBeInTheDocument();
    expect(screen.getByText('company')).toBeInTheDocument();
    expect(screen.getByText('legal')).toBeInTheDocument();
  });

  it('renders social/brand links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    // Brand name in footer
    expect(screen.getByText('CGraph')).toBeInTheDocument();
  });
});
