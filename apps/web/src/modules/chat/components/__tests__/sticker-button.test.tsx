/**
 * @file Tests for StickerButton component (sticker-picker)
 * @module chat/components/sticker-picker/sticker-button
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
      title,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
      title?: string;
    }) => (
      <button className={className} onClick={onClick} title={title}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { StickerButton } from '../sticker-picker/sticker-button';

describe('StickerButton', () => {
  it('renders a button with title', () => {
    render(<StickerButton onClick={vi.fn()} />);
    expect(screen.getByTitle('Send a sticker')).toBeInTheDocument();
  });

  it('renders SparklesIcon', () => {
    render(<StickerButton onClick={vi.fn()} />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StickerButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies active styles when isActive is true', () => {
    render(<StickerButton onClick={vi.fn()} isActive={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-500/20');
  });

  it('applies inactive styles when isActive is false', () => {
    render(<StickerButton onClick={vi.fn()} isActive={false} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-gray-400');
  });

  it('applies default inactive styles when isActive is undefined', () => {
    render(<StickerButton onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-gray-400');
  });

  it('applies custom className', () => {
    render(<StickerButton onClick={vi.fn()} className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('renders as a button element', () => {
    render(<StickerButton onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
