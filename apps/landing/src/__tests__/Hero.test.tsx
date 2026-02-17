/**
 * Hero Section Tests
 *
 * Verifies the hero heading, CTA buttons, and trust badges.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
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
                'style',
              ].includes(key)
            ) {
              htmlProps[key] = val;
            }
          }
          const Tag = prop as React.ElementType;
          return <Tag {...htmlProps}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 1,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useSpring: () => ({ get: () => 0, set: vi.fn() }),
}));

// Lazy import to apply mocks before module loads
const importHero = () => import('../components/marketing/sections/Hero');

describe('Hero', () => {
  it('renders without crashing', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    // The hero section should be in the DOM
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('renders the main heading text', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders CTA buttons', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    expect(screen.getByText('Explore Features')).toBeInTheDocument();
  });

  it('renders trust badges', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(screen.getByText('E2E Encrypted')).toBeInTheDocument();
    expect(screen.getByText('Zero-Knowledge')).toBeInTheDocument();
  });

  it('has an accessible aria-label', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    const section = screen.getByLabelText(/beyond messaging/i);
    expect(section).toBeInTheDocument();
  });

  it('Get Started Free links to registration', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    const cta = screen.getByText('Get Started Free').closest('a');
    expect(cta).toHaveAttribute('href', expect.stringContaining('register'));
  });

  it('Explore Features links to features section', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    const link = screen.getByText('Explore Features').closest('a');
    expect(link).toHaveAttribute('href', '#features');
  });
});
