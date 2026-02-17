/**
 * SEO Component Tests
 *
 * Verifies meta tag generation, canonical URLs, and JSON-LD injection.
 * Uses a mock of react-helmet-async since Helmet doesn't inject into jsdom.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';

// Capture what Helmet receives
const helmets: Array<Record<string, unknown>> = [];

vi.mock('react-helmet-async', async () => {
  const actual = await vi.importActual<typeof import('react-helmet-async')>('react-helmet-async');
  return {
    ...actual,
    Helmet: ({ children }: React.PropsWithChildren) => {
      // Collect children for inspection
      const childArray = Array.isArray(children) ? children : [children];
      const record: Record<string, unknown> = {};
      for (const child of childArray) {
        if (child && typeof child === 'object' && 'type' in child) {
          const { type, props } = child as { type: string; props: Record<string, unknown> };
          if (type === 'title') record.title = props.children;
          if (type === 'meta' && props.name === 'description') record.description = props.content;
          if (type === 'meta' && props.name === 'robots') record.robots = props.content;
          if (type === 'meta' && props.property === 'og:type') record.ogType = props.content;
          if (type === 'meta' && props.property === 'og:title') record.ogTitle = props.content;
          if (type === 'meta' && props.name === 'twitter:card') record.twitterCard = props.content;
          if (type === 'link' && props.rel === 'canonical') record.canonical = props.href;
          if (type === 'script' && props.type === 'application/ld+json')
            record.jsonLd = props.children;
        }
      }
      helmets.push(record);
      return null;
    },
  };
});

// Lazy import so mocks apply
const importSEO = () => import('../components/SEO');

const renderSEO = async (props: Record<string, unknown> = {}) => {
  helmets.length = 0;
  const { default: SEO } = await importSEO();
  render(
    <HelmetProvider>
      <SEO {...(props as Parameters<typeof SEO>[0])} />
    </HelmetProvider>
  );
  return helmets[helmets.length - 1] ?? {};
};

describe('SEO', () => {
  it('renders default title when no props provided', async () => {
    const h = await renderSEO();
    expect(h.title).toContain('CGraph');
  });

  it('appends " | CGraph" suffix to custom title', async () => {
    const h = await renderSEO({ title: 'About' });
    expect(h.title).toBe('About | CGraph');
  });

  it('sets meta description', async () => {
    const h = await renderSEO({ description: 'Test description' });
    expect(h.description).toBe('Test description');
  });

  it('sets canonical URL from path', async () => {
    const h = await renderSEO({ path: '/blog' });
    expect(h.canonical).toContain('/blog');
  });

  it('sets Open Graph type', async () => {
    const h = await renderSEO({ type: 'article' });
    expect(h.ogType).toBe('article');
  });

  it('sets Twitter Card type', async () => {
    const h = await renderSEO();
    expect(h.twitterCard).toBe('summary_large_image');
  });

  it('adds noindex meta when specified', async () => {
    const h = await renderSEO({ noindex: true });
    expect(h.robots).toBe('noindex, nofollow');
  });

  it('does not add noindex by default', async () => {
    const h = await renderSEO();
    expect(h.robots).toBeUndefined();
  });

  it('injects JSON-LD structured data', async () => {
    const jsonLd = { '@type': 'Organization', name: 'CGraph' };
    const h = await renderSEO({ jsonLd });
    expect(h.jsonLd).toContain('CGraph');
  });
});
