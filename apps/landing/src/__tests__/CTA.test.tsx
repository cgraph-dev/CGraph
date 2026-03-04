/**
 * CTA Section Tests
 *
 * Verifies call-to-action heading and action buttons.
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

const importCTA = () => import('../components/marketing/sections/CTA');

describe('CTA', () => {
  it('renders without crashing', async () => {
    const { CTA } = await importCTA();
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>
    );
    expect(document.querySelector('section')).toBeInTheDocument();
  });

  it('renders the section badge', async () => {
    const { CTA } = await importCTA();
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>
    );
    expect(screen.getByText('Ready to Start?')).toBeInTheDocument();
  });

  it('renders CTA buttons', async () => {
    const { CTA } = await importCTA();
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>
    );
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders the description text', async () => {
    const { CTA } = await importCTA();
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>
    );
    expect(screen.getByText(/Create forums, customize your space/i)).toBeInTheDocument();
  });
});
