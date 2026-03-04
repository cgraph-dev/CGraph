/**
 * Security Section Tests
 *
 * Verifies the security section heading and privacy-first messaging.
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

const importSecurity = () => import('../components/marketing/sections/Security');

describe('Security', () => {
  it('renders without crashing', async () => {
    const { Security } = await importSecurity();
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    );
    expect(document.querySelector('section')).toBeInTheDocument();
  });

  it('renders the privacy-first badge', async () => {
    const { Security } = await importSecurity();
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    );
    expect(screen.getByText('Privacy-First')).toBeInTheDocument();
  });

  it('mentions PQXDH in the description', async () => {
    const { Security } = await importSecurity();
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    );
    expect(screen.getByText(/PQXDH/)).toBeInTheDocument();
  });

  it('mentions Triple Ratchet in the description', async () => {
    const { Security } = await importSecurity();
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    );
    expect(screen.getByText(/Triple Ratchet/)).toBeInTheDocument();
  });
});
