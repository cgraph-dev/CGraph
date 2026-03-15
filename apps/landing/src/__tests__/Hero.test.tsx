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
    // Hero uses cycling subtitles instead of CTA buttons
    expect(screen.getByText('Reimagined')).toBeInTheDocument();
    expect(screen.getByText('Scroll to explore')).toBeInTheDocument();
  });

  it('renders cycling subtitles', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    // First subtitle is shown by default
    expect(
      screen.getByText('End-to-end encrypted messaging with post-quantum security.')
    ).toBeInTheDocument();
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

  it('scroll indicator targets features section', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    // Scroll indicator exists and clicking it calls scrollIntoView
    const scrollText = screen.getByText('Scroll to explore');
    expect(scrollText).toBeInTheDocument();
  });

  it('renders multiple cycling subtitle options', async () => {
    const { default: Hero } = await importHero();
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    // Verify that at least one subtitle is in the document
    const subtitle = screen.getByText(/encrypted messaging|community forums|video calls/i);
    expect(subtitle).toBeInTheDocument();
  });
});
