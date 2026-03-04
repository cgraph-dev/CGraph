/**
 * Footer Component Tests
 *
 * Verifies footer column headings, copyright text, and social links.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../components/marketing/layout/Footer';

// Mock framer-motion to avoid animation issues in tests
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

describe('Footer', () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

  it('renders without crashing', () => {
    renderFooter();
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders footer column headings', () => {
    renderFooter();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders copyright text with current year', () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    const copyright = screen.getByText(
      (content) => content.includes(year) && content.includes('CGraph')
    );
    expect(copyright).toBeInTheDocument();
  });

  it('renders the CGraph logo link', () => {
    renderFooter();
    const logoLink = screen.getByLabelText('CGraph Home');
    expect(logoLink).toBeInTheDocument();
  });

  it('renders social links', () => {
    renderFooter();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('contains navigation links', () => {
    renderFooter();
    const links = document.querySelectorAll('footer a');
    // Footer should have multiple links (footer columns + social + logo)
    expect(links.length).toBeGreaterThan(5);
  });
});
