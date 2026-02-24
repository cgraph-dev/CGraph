/**
 * @file Tests for MinimalBanner component (premium-banner)
 * @module premium/components/premium-banner/minimal-banner
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

import { MinimalBanner } from '../premium-banner/minimal-banner';

describe('MinimalBanner', () => {
  it('renders "Go Premium" text', () => {
    render(<MinimalBanner onUpgrade={vi.fn()} />);
    expect(screen.getByText('Go Premium')).toBeInTheDocument();
  });

  it('renders upgrade button', () => {
    render(<MinimalBanner onUpgrade={vi.fn()} />);
    expect(screen.getByText('Upgrade →')).toBeInTheDocument();
  });

  it('renders sparkles icon', () => {
    render(<MinimalBanner onUpgrade={vi.fn()} />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('calls onUpgrade when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    render(<MinimalBanner onUpgrade={onUpgrade} />);
    await user.click(screen.getByText('Upgrade →'));
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(<MinimalBanner onUpgrade={vi.fn()} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders gradient background', () => {
    const { container } = render(<MinimalBanner onUpgrade={vi.fn()} />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('bg-gradient-to-r');
  });

  it('renders as a flex container', () => {
    const { container } = render(<MinimalBanner onUpgrade={vi.fn()} />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('flex');
  });

  it('renders without className', () => {
    const { container } = render(<MinimalBanner onUpgrade={vi.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
