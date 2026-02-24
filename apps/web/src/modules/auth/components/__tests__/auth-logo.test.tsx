/** @module auth-logo tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => <div>{children}</div>,
  },
}));

import { AuthLogo } from '../auth-logo';

describe('AuthLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CGraph text', () => {
    render(<AuthLogo size="md" />);
    expect(screen.getByText('CGraph')).toBeInTheDocument();
  });

  it('renders logo image', () => {
    render(<AuthLogo size="md" />);
    expect(screen.getByAltText('CGraph')).toBeInTheDocument();
  });

  it('renders as a link to cgraph.org', () => {
    render(<AuthLogo size="md" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.cgraph.org');
  });

  it('renders sm size with correct dimensions', () => {
    render(<AuthLogo size="sm" />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('height', '32');
    expect(img).toHaveAttribute('width', '32');
  });

  it('renders md size with correct dimensions', () => {
    render(<AuthLogo size="md" />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('height', '40');
    expect(img).toHaveAttribute('width', '40');
  });

  it('renders lg size with correct dimensions', () => {
    render(<AuthLogo size="lg" />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('height', '48');
    expect(img).toHaveAttribute('width', '48');
  });
});
