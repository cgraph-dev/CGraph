/**
 * FeaturesSection — Liquid Glass feature cards tests.
 *
 * Verifies section heading, feature card rendering, and glass-surface class.
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

import { FeaturesSection } from '@/components/liquid-glass';

describe('FeaturesSection', () => {
  it('renders section heading', () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Everything you need, nothing you don't")).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('End-to-End Encrypted')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Forums')).toBeInTheDocument();
    expect(screen.getByText('Voice & Video Calls')).toBeInTheDocument();
  });

  it('feature cards have glass-surface class', () => {
    const { container } = render(<FeaturesSection />);
    const glassCards = container.querySelectorAll('.glass-surface');
    expect(glassCards.length).toBeGreaterThan(0);
  });
});
