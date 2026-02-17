/**
 * Features Section Tests
 *
 * Verifies section heading, description, and feature cards.
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
                'transition',
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
}));

const importFeatures = () => import('../components/marketing/sections/Features');

describe('Features', () => {
  it('renders without crashing', async () => {
    const { Features } = await importFeatures();
    render(
      <MemoryRouter>
        <Features />
      </MemoryRouter>
    );
    expect(document.querySelector('section')).toBeInTheDocument();
  });

  it('renders the section header', async () => {
    const { Features } = await importFeatures();
    render(
      <MemoryRouter>
        <Features />
      </MemoryRouter>
    );
    expect(screen.getByText('Powerful Features')).toBeInTheDocument();
  });

  it('renders the section description', async () => {
    const { Features } = await importFeatures();
    render(
      <MemoryRouter>
        <Features />
      </MemoryRouter>
    );
    expect(screen.getByText(/comprehensive feature set/i)).toBeInTheDocument();
  });

  it('renders feature cards', async () => {
    const { Features } = await importFeatures();
    const { container } = render(
      <MemoryRouter>
        <Features />
      </MemoryRouter>
    );
    // Should render multiple feature cards in a grid
    const cards = container.querySelectorAll('.features__grid > *');
    expect(cards.length).toBeGreaterThan(0);
  });
});
