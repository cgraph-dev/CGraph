/**
 * @file Tests for StickerSearchBar component (sticker-picker)
 * @module chat/components/sticker-picker/sticker-search-bar
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className} />
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { StickerSearchBar } from '../sticker-picker/sticker-search-bar';

describe('StickerSearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    render(<StickerSearchBar searchQuery="cat" onSearchChange={vi.fn()} />);
    expect(screen.getByDisplayValue('cat')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<StickerSearchBar searchQuery="" onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search stickers...');
    await user.type(input, 'a');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders as a text input', () => {
    render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search stickers...');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('input is focusable', async () => {
    const user = userEvent.setup();
    render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search stickers...');
    await user.click(input);
    expect(input).toHaveFocus();
  });

  it('renders with border container', () => {
    const { container } = render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    expect(container.querySelector('.border-b')).toBeInTheDocument();
  });

  it('shows empty input when searchQuery is empty', () => {
    render(<StickerSearchBar searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search stickers...');
    expect(input).toHaveValue('');
  });
});
