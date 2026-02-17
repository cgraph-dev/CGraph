/**
 * Navigation Component Tests
 *
 * Smoke tests for the marketing Navigation component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../components/marketing/layout/Navigation';

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

  it('renders skip-to-content link for accessibility', () => {
    renderWithRouter();
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders Get Started CTA button', () => {
    renderWithRouter();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('shows landing-specific links when showLandingLinks is true', () => {
    renderWithRouter({ showLandingLinks: true });
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('mobile menu toggle has correct aria attributes', () => {
    renderWithRouter();
    const button = screen.getByLabelText(/open menu/i);
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('mobile menu toggle button is clickable', () => {
    renderWithRouter();
    const button = screen.getByLabelText(/open menu/i);
    // Button should be interactive (not disabled)
    expect(button).toBeEnabled();
    expect(button.tagName).toBe('BUTTON');
  });

  it('Get Started CTA links to registration', () => {
    renderWithRouter();
    const ctaLink = document.querySelector('a[href*="register"]');
    expect(ctaLink).toBeInTheDocument();
  });
});
