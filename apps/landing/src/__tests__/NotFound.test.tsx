/**
 * NotFound Page Tests
 *
 * Verifies the 404 page renders correct content and navigation links.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

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
}));

// Mock canvas-dependent components to avoid jsdom canvas limitations
vi.mock('../components/marketing/effects/NeuralBackground', () => ({
  default: () => null,
  NeuralBackground: () => null,
}));

vi.mock('../components/marketing/layout/GlobalBackground', () => ({
  default: () => null,
  GlobalBackground: () => null,
}));

const importNotFound = () => import('../pages/NotFound');

describe('NotFound (404)', () => {
  const renderNotFound = async () => {
    const { default: NotFound } = await importNotFound();
    return render(
      <HelmetProvider>
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      </HelmetProvider>
    );
  };

  it('renders without crashing', async () => {
    await renderNotFound();
    const elements = screen.getAllByText('404');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the error message', async () => {
    await renderNotFound();
    expect(screen.getByText(/may have been moved or removed/i)).toBeInTheDocument();
  });

  it('renders a "Back to Home" link', async () => {
    await renderNotFound();
    const homeLinks = screen.getAllByText(/back to home/i);
    expect(homeLinks.length).toBeGreaterThan(0);
    const hasHomeHref = homeLinks.some((el) => el.closest('a')?.getAttribute('href') === '/');
    expect(hasHomeHref).toBe(true);
  });

  it('renders links to Documentation and Blog', async () => {
    await renderNotFound();
    const docsLinks = screen.getAllByText('Documentation');
    const blogLinks = screen.getAllByText('Blog');
    // At least one docs and one blog link exist
    expect(docsLinks.length).toBeGreaterThan(0);
    expect(blogLinks.length).toBeGreaterThan(0);
    // At least one links to /docs and /blog
    const docsHrefs = docsLinks.map((el) => el.closest('a')?.getAttribute('href'));
    const blogHrefs = blogLinks.map((el) => el.closest('a')?.getAttribute('href'));
    expect(docsHrefs).toContain('/docs');
    expect(blogHrefs).toContain('/blog');
  });
});
