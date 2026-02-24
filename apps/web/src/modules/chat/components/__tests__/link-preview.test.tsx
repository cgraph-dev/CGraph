/** @module LinkPreview tests */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

import LinkPreview from '../rich-media-embed/link-preview';

function makeEmbed(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://example.com',
    title: 'Example Site',
    description: 'An example website for testing',
    image: 'https://example.com/preview.jpg',
    siteName: 'Example',
    favicon: 'https://example.com/favicon.ico',
    ...overrides,
  };
}

describe('LinkPreview', () => {
  it('renders the title', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    expect(screen.getByText('Example Site')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    expect(screen.getByText('An example website for testing')).toBeInTheDocument();
  });

  it('renders the site name', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('renders an image when provided', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    const img = screen.getByAlt('Example Site');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/preview.jpg');
  });

  it('does not render image when not provided', () => {
    render(<LinkPreview embed={makeEmbed({ image: undefined })} />);
    expect(screen.queryByAlt('Example Site')).not.toBeInTheDocument();
  });

  it('renders favicon when provided', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    const favicon = screen.getByAlt('');
    expect(favicon).toHaveAttribute('src', 'https://example.com/favicon.ico');
  });

  it('renders as a link with correct href', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('opens link in new tab', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders external link icon', () => {
    render(<LinkPreview embed={makeEmbed()} />);
    expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
  });

  it('renders without title or description', () => {
    render(<LinkPreview embed={makeEmbed({ title: undefined, description: undefined })} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
