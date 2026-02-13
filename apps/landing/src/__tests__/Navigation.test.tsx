/**
 * Navigation Component Tests
 *
 * Smoke tests for the marketing Navigation component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../components/marketing/Navigation';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        variants: _v,
        ...rest
      } = props as Record<string, unknown>;
      return <nav {...(rest as React.HTMLAttributes<HTMLElement>)}>{children}</nav>;
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        variants: _v,
        ...rest
      } = props as Record<string, unknown>;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileHover: _h, whileTap: _t, ...rest } = props as Record<string, unknown>;
      return (
        <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
      );
    },
    a: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileHover: _h, whileTap: _t, ...rest } = props as Record<string, unknown>;
      return <a {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('Navigation', () => {
  const renderWithRouter = (props = {}) =>
    render(
      <MemoryRouter>
        <Navigation {...props} />
      </MemoryRouter>
    );

  it('renders without crashing', () => {
    renderWithRouter();
    // Navigation should render a nav element
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('renders the CGraph logo', () => {
    renderWithRouter();
    const logo = screen.getByAltText('CGraph');
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter();
    // Should have some links
    const links = document.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });
});
